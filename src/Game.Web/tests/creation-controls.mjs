// Use the real visible questionnaire; the first choice is the original
// penniless vagrant so the existing ten-silver training-reward check stays exact.
export async function completeCreation(page, click) {
  for (const [question, answer] of [3, 3, 0, 0, 0, 0, 0].entries())
    await click(`[data-action="creation-answer"][data-question="${question}"][data-index="${answer}"]`);
  await click('[data-action="creation-portrait"][data-id="头像.主角"]');
  await click('[data-action="creation-confirm"]');
}
