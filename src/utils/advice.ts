import type { AdviceProfile } from '../types/air-quality'
import { getAqiCategory } from './aqi'

function getGeneralOutdoorAdvice(aqi: number): string {
  if (aqi <= 50) {
    return 'Outdoor activity is generally okay; take normal precautions.'
  }

  if (aqi <= 100) {
    return 'Consider shorter outdoor workouts and watch for symptoms.'
  }

  if (aqi <= 150) {
    return 'Move strenuous outdoor activity indoors or postpone it.'
  }

  if (aqi <= 200) {
    return 'Avoid strenuous outdoor activity and keep windows closed.'
  }

  return 'Remain indoors when possible and use filtered air if available.'
}

function getProfileAdvice(aqi: number, profile: AdviceProfile): string[] {
  const advice: string[] = []

  if (profile.jogging) {
    const joggingAdvice =
      aqi > 100
        ? 'Swap jogging for a low-intensity indoor workout.'
        : 'Keep jogging easy and stop if symptoms start.'
    advice.push(joggingAdvice)
  }

  if (profile.kids) {
    advice.push('Keep children away from heavy traffic and reduce active outdoor play when AQI is elevated.')
  }

  if (profile.asthma) {
    advice.push('Carry prescribed inhaler medication and avoid outdoor triggers.')
  }

  if (profile.elderly) {
    advice.push('Limit prolonged outdoor exposure and check in with a clinician if symptoms worsen.')
  }

  if (profile.commuting) {
    const commutingAdvice =
      aqi > 100
        ? 'Use recirculated cabin air and avoid waiting near exhaust.'
        : 'Normal commuting precautions are appropriate.'
    advice.push(commutingAdvice)
  }

  return advice
}

/** Builds rule-based, personalised advice without relying on an external AI service. */
export function getAdvice(aqi: number, profile: AdviceProfile): string[] {
  const category = getAqiCategory(aqi)
  const advice = [getGeneralOutdoorAdvice(aqi), ...getProfileAdvice(aqi, profile)]

  if (category.name === 'Good') {
    advice.push('Windows can remain open if local smoke or pollen is not a concern.')
  } else {
    advice.push('Close windows and consider a properly fitted well-made mask outside.')
  }

  return advice
}
