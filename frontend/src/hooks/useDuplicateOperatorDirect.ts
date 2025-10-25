"use client";

import { supabase } from "@/lib/conn/supabaseClient";
import { toast } from "react-toastify";
import type { DuplicateOperatorData } from "@/types/data-rekam/duplicate-operator";

export interface DuplicateOperatorFilters {
  page?: number;
  pageSize?: number;
  search?: string;
}

export async function fetchDuplicateOperators(): Promise<DuplicateOperatorData[]> {
  const { data, error } = await supabase
    .from("duplicate_operator")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Gagal mengambil data: ${error.message}`);
  }

  return data || [];
}

export async function createDuplicateOperator(record: any): Promise<DuplicateOperatorData> {
  const { data, error } = await supabase
    .from("duplicate_operator")
    .insert([record])
    .select()
    .single();

  if (error) {
    throw new Error(`Gagal membuat data: ${error.message}`);
  }

  return data as DuplicateOperatorData;
}

export async function updateDuplicateOperator(
  id: string,
  updates: any
): Promise<DuplicateOperatorData> {
  const { data, error } = await supabase
    .from("duplicate_operator")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(`Gagal memperbarui data: ${error.message}`);
  }

  return data as DuplicateOperatorData;
}

export async function deleteDuplicateOperator(id: string): Promise<void> {
  const { error } = await supabase
    .from("duplicate_operator")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(`Gagal menghapus data: ${error.message}`);
  }
}

export async function toggleIsReadyToRecord(
  id: string,
  currentStatus: boolean
): Promise<DuplicateOperatorData> {
  const { data, error } = await supabase
    .from("duplicate_operator")
    .update({ is_ready_to_record: !currentStatus })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(`Gagal mengubah status: ${error.message}`);
  }

  return data as DuplicateOperatorData;
}
