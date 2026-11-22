// Makes a label like "Mathematics · Class 10".
// subject.className comes from the backend automatically (the @Formula in Step 1).
// "export" = other files can import and use this function.
export function subjectLabel(subject) {
  // No subject given → empty text instead of a crash
  if (!subject) return '';
  // Has a class name → "Name · Class", otherwise just "Name"
  return subject.className ? `${subject.name} · ${subject.className}` : subject.name;
}