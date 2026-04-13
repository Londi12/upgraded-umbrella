function fuzzyScore(a: string, b: string): number {
  if (!a || !b) return 0
  const al = a.toLowerCase()
  const bl = b.toLowerCase()
  if (al === bl) return 1
  if (bl.includes(al) || al.includes(bl)) return 0.8
  return 0
}
