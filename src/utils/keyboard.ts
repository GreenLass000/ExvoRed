/** Devuelve si una tecla se ha originado dentro de un control de edición. */
export const isEditableTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false;

  return target.isContentEditable || Boolean(
    target.closest('input, textarea, select, [contenteditable="true"], [role="textbox"]')
  );
};
