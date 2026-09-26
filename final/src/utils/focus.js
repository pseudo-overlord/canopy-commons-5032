import { nextTick } from "vue";
export async function focusFirstError(event) {
  const form = event?.target;
  await nextTick();
  form?.querySelector('[aria-invalid="true"]')?.focus();
}
