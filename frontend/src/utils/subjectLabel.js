// Makes a label like "Mathematics · LPS · Class 10".
// subject.className comes from the backend automatically (the @Formula).
export function subjectLabel(subject) {
  if (!subject) return '';
  return subject.className ? `${subject.name} · ${subject.className}` : subject.name;
}

// NEW: makes a class label like "LPS · Class 10".
// cls.schoolName comes from the backend automatically (the @Formula in ClassEntity).
export function classLabel(cls) {
  if (!cls) return '';
  return cls.schoolName ? `${cls.schoolName} · ${cls.name}` : cls.name;
}