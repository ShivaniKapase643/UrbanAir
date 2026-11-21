import type { AdviceProfile } from '../types/air-quality'
import { getAqiCategory } from './aqi'

/** Builds rule-based, personalised advice without relying on an external AI service. */
export function getAdvice(aqi: number, profile: AdviceProfile): string[] {
  const category = getAqiCategory(aqi)
  const advice: string[] = []
  if (aqi <= 50) advice.push('Outdoor activity is generally okay; take normal precautions.')
  else if (aqi <= 100) advice.push('Consider shorter outdoor workouts and watch for symptoms.')
  else if (aqi <= 150) advice.push('Move strenuous outdoor activity indoors or postpone it.')
  else if (aqi <= 200) advice.push('Avoid strenuous outdoor activity and keep windows closed.')
  else advice.push('Remain indoors when possible and use filtered air if available.')
  if (profile.jogging) advice.push(aqi > 100 ? 'Swap jogging for a low-intensity indoor workout.' : 'Keep jogging easy and stop if symptoms start.')
  if (profile.kids) advice.push('Keep children away from heavy traffic and reduce active outdoor play when AQI is elevated.')
  if (profile.asthma) advice.push('Carry prescribed inhaler medication and avoid outdoor triggers.')
  if (profile.elderly) advice.push('Limit prolonged outdoor exposure and check in with a clinician if symptoms worsen.')
  if (profile.commuting) advice.push(aqi > 100 ? 'Use recirculated cabin air and avoid waiting near exhaust.' : 'Normal commuting precautions are appropriate.')
  advice.push(category.name === 'Good' ? 'Windows can remain open if local smoke or pollen is not a concern.' : 'Close windows and consider a properly fitted well-made mask outside.')
  return advice
}
