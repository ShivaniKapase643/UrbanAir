import { describe, expect, it } from 'vitest'
import { getAqiCategory } from '../src/utils/aqi'
import { getAdvice } from '../src/utils/advice'

const profile = { jogging: false, kids: false, asthma: false, elderly: false, commuting: false }

describe('AQI categories', () => {
  it.each([[25,'Good'],[75,'Moderate'],[125,'Unhealthy for Sensitive Groups'],[175,'Unhealthy'],[250,'Very Unhealthy'],[400,'Hazardous']])('maps %i to %s', (aqi, name) => {
    expect(getAqiCategory(Number(aqi)).name).toBe(name)
  })
  it('handles invalid and extreme values safely', () => {
    expect(getAqiCategory(Number.NaN).name).toBe('Good')
    expect(getAqiCategory(900).name).toBe('Hazardous')
  })
})

describe('advice engine', () => {
  it('covers personalised profiles', () => {
    const advice = getAdvice(175, { jogging: true, kids: true, asthma: true, elderly: true, commuting: true })
    expect(advice.join(' ')).toMatch(/jogging|workout/i)
    expect(advice.join(' ')).toMatch(/children/i)
    expect(advice.join(' ')).toMatch(/inhaler/i)
  })
  it('covers Good through Hazardous branches', () => {
    expect(getAdvice(20, profile)[0]).toMatch(/generally okay/i)
    expect(getAdvice(75, profile)[0]).toMatch(/shorter/i)
    expect(getAdvice(125, profile)[0]).toMatch(/indoors/i)
    expect(getAdvice(175, profile)[0]).toMatch(/strenuous/i)
    expect(getAdvice(350, profile)[0]).toMatch(/remain indoors/i)
  })
})
