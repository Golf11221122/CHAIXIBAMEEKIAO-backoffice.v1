-- =====================================================================
-- CHAIXI BAMEEKIAO BACK OFFICE
-- PATCH: Safe Production Batch Output Correction V1
-- Purpose:
--   - แก้ actual_output_qty ของ Production Batch ที่กรอกผิด
--   - คำนวณ Unit Cost / Yield / Yield Variance / Yield Loss ใหม่เฉพาะ Batch นั้น
--   - ไม่แก้ Input และไม่ย้อนแก้ Batch อื่น
--   - เลือกได้ว่าจะปรับ current_stock เพิ่ม/ลดตามส่วนต่างหรือไม่
--
-- IMPORTANT FOR PB-20260829-0008:
--   ผู้ใช้แจ้งว่าได้ทำ Adjust Stock ชดเชยไปแล้ว
--   ตอนแก้ 990 -> 10000 ให้ส่ง p_stock_already_adjusted = true
--   เพื่อป้องกัน Stock ถูกเพิ่มซ้ำอีก 9,010 g
-- =====================================================================

begin;

create or replace function public.backoffice_correct_production_batch_output_v1(
    p_batch_id uuid,
    p_actual_output_qty numeric,
    p_stock_already_adjusted boolean default true
)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
    v_user uuid;
    v_branch uuid;
    v_role text;
    v_batch public.production_batches%rowtype;
    v_old_qty numeric;
    v_delta numeric;
    v_total numeric := 0;
    v_basis_qty numeric := 0;
    v_unit_cost numeric := 0;
    v_actual_yield numeric := null;
    v_yield_var numeric := null;
    v_loss_value numeric := 0;
    v_expected_output numeric := 0;
    v_stock_before numeric;
    v_stock_after numeric;
    v_movement_type text;
    v_note text;
begin
    select x.user_id, x.branch_id
      into v_user, v_branch
      from public._bo_ctx() x;

    if v_user is null or v_branch is null then
        raise exception 'BACKOFFICE_PERMISSION_DENIED';
    end if;

    select lower(trim(coalesce(p.role,'')))
      into v_role
      from public.profiles p
     where p.id = v_user
       and p.branch_id = v_branch;

    if coalesce(v_role,'') not in ('admin','manager') then
        raise exception 'ADMIN_OR_MANAGER_REQUIRED';
    end if;

    if coalesce(p_actual_output_qty,0) <= 0 then
        raise exception 'OUTPUT_QTY_REQUIRED';
    end if;

    select *
      into v_batch
      from public.production_batches b
     where b.id = p_batch_id
       and b.branch_id = v_branch
     for update;

    if not found then
        raise exception 'PRODUCTION_BATCH_NOT_FOUND';
    end if;

    if v_batch.status <> 'posted' then
        raise exception 'ONLY_POSTED_BATCH_CAN_BE_CORRECTED';
    end if;

    v_old_qty := v_batch.actual_output_qty;
    v_delta := round(p_actual_output_qty - v_old_qty, 3);

    -- ใช้ต้นทุน Input Snapshot เดิมของ Batch เพื่อไม่กระทบรายการอื่น
    select
        coalesce(sum(bi.line_cost),0),
        coalesce(sum(case when bi.is_yield_basis then bi.quantity else 0 end),0)
      into v_total, v_basis_qty
      from public.production_batch_inputs bi
     where bi.production_batch_id = v_batch.id;

    v_unit_cost := case
        when p_actual_output_qty > 0 then round(v_total / p_actual_output_qty, 4)
        else 0
    end;

    if v_basis_qty > 0 then
        v_actual_yield := round(p_actual_output_qty / v_basis_qty * 100, 4);

        if v_batch.standard_yield_pct is not null then
            v_yield_var := round(v_actual_yield - v_batch.standard_yield_pct, 4);
            v_expected_output := v_basis_qty * v_batch.standard_yield_pct / 100;

            if v_actual_yield < v_batch.standard_yield_pct then
                v_loss_value := round(
                    greatest(v_expected_output - p_actual_output_qty, 0) * v_unit_cost,
                    2
                );
            end if;
        end if;
    end if;

    update public.production_batches
       set actual_output_qty = round(p_actual_output_qty,3),
           basis_input_qty = v_basis_qty,
           total_input_cost = round(v_total,2),
           output_unit_cost = v_unit_cost,
           actual_yield_pct = v_actual_yield,
           yield_variance_pct = v_yield_var,
           yield_loss_value = v_loss_value,
           note = concat_ws(
               E'\n',
               nullif(trim(coalesce(v_batch.note,'')),''),
               '[CORRECTED OUTPUT] ' || v_old_qty || ' -> ' || round(p_actual_output_qty,3)
               || ' by ' || coalesce(v_user::text,'unknown')
               || ' at ' || to_char(now(),'YYYY-MM-DD HH24:MI:SS TZ')
           )
     where id = v_batch.id;

    -- หาก Stock ถูก Adjust ชดเชยไว้แล้ว จะไม่แตะ current_stock ซ้ำ
    if not coalesce(p_stock_already_adjusted,true) and v_delta <> 0 then
        select coalesce(i.current_stock,0)
          into v_stock_before
          from public.ingredients i
         where i.id = v_batch.output_ingredient_id
           and i.branch_id = v_branch
         for update;

        if not found then
            raise exception 'PRODUCTION_OUTPUT_NOT_FOUND';
        end if;

        v_stock_after := round(v_stock_before + v_delta,3);
        if v_stock_after < 0 then
            raise exception 'CORRECTION_WOULD_MAKE_STOCK_NEGATIVE';
        end if;

        update public.ingredients
           set current_stock = v_stock_after,
               updated_at = now()
         where id = v_batch.output_ingredient_id
           and branch_id = v_branch;

        v_movement_type := case when v_delta > 0 then 'adjust_in' else 'adjust_out' end;
        v_note := 'Production correction ' || v_batch.batch_no
                  || ' Output ' || v_old_qty || ' -> ' || round(p_actual_output_qty,3);

        insert into public.ingredient_stock_movements(
            branch_id,
            ingredient_id,
            movement_type,
            quantity,
            stock_before,
            stock_after,
            unit_cost,
            note,
            created_by
        ) values (
            v_branch,
            v_batch.output_ingredient_id,
            v_movement_type,
            abs(v_delta),
            v_stock_before,
            v_stock_after,
            v_unit_cost,
            v_note,
            v_user
        );
    end if;

    return jsonb_build_object(
        'batch_id', v_batch.id,
        'batch_no', v_batch.batch_no,
        'old_output_qty', v_old_qty,
        'new_output_qty', round(p_actual_output_qty,3),
        'delta_qty', v_delta,
        'stock_adjusted_by_this_rpc', not coalesce(p_stock_already_adjusted,true),
        'input_cost', round(v_total,2),
        'output_unit_cost', v_unit_cost,
        'actual_yield_pct', v_actual_yield,
        'standard_yield_pct', v_batch.standard_yield_pct,
        'yield_variance_pct', v_yield_var,
        'yield_loss_value', v_loss_value
    );
end;
$$;

revoke all on function public.backoffice_correct_production_batch_output_v1(uuid,numeric,boolean) from public;
grant execute on function public.backoffice_correct_production_batch_output_v1(uuid,numeric,boolean) to authenticated;

commit;

-- ไม่มี TEST SELECT ท้ายไฟล์
-- หลังรัน SQL แล้ว ให้ทดสอบจาก Back Office > Production / Prep เท่านั้น
