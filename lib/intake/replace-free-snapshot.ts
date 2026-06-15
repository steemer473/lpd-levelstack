import type { SupabaseClient } from "@supabase/supabase-js"

/** Dev only — remove prior free snapshot rows so the same email can re-test. */
export async function deletePriorFreeSnapshotForUser(
  admin: SupabaseClient,
  userId: string,
): Promise<{ deletedIntakeIds: string[] }> {
  const { data: intakes, error: listError } = await admin
    .from("levelstack_intakes")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "submitted")

  if (listError) {
    throw new Error(`Failed to list prior intakes: ${listError.message}`)
  }

  const ids = (intakes ?? []).map((row) => row.id)
  if (ids.length === 0) {
    return { deletedIntakeIds: [] }
  }

  const { error: deleteError } = await admin
    .from("levelstack_intakes")
    .delete()
    .eq("user_id", userId)
    .eq("status", "submitted")

  if (deleteError) {
    throw new Error(`Failed to delete prior intakes: ${deleteError.message}`)
  }

  return { deletedIntakeIds: ids }
}
