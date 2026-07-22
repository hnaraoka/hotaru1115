/**
 * Age as of a report's target year/month, computed from a birth date.
 * Month-granularity (day of birth is ignored) to stay consistent with how
 * the rest of the report treats target year/month elsewhere (e.g.
 * computeProjectPeriodMonths in ReportForm).
 */
export function calculateAgeAsOf(birthDate: Date, targetYear: number, targetMonth: number): number {
  const birthYear = birthDate.getUTCFullYear();
  const birthMonth = birthDate.getUTCMonth() + 1;
  let age = targetYear - birthYear;
  if (targetMonth < birthMonth) age--;
  return Math.max(0, age);
}

/**
 * Full years of engineering experience as of a report's target year/month,
 * computed from the year/month the user started their career.
 */
export function calculateExperienceYears(
  startYear: number,
  startMonth: number,
  targetYear: number,
  targetMonth: number,
): number {
  const months = (targetYear - startYear) * 12 + (targetMonth - startMonth);
  return Math.max(0, Math.floor(months / 12));
}
