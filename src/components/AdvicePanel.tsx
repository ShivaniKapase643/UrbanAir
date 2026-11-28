import type { AdviceProfile } from '../types/air-quality'

interface Props {
  advice: string[]
  profile: AdviceProfile
  onProfileChange: (profileKey: keyof AdviceProfile, checked: boolean) => void
}

const DEFAULT_PROFILE_KEYS: Array<keyof AdviceProfile> = [
  'jogging',
  'kids',
  'asthma',
  'elderly',
  'commuting',
]

function formatProfileLabel(profileKey: keyof AdviceProfile): string {
  if (profileKey === 'kids') {
    return 'Kids'
  }

  return profileKey.charAt(0).toUpperCase() + profileKey.slice(1)
}

export function AdvicePanel({ advice, profile, onProfileChange }: Props) {
  return (
    <section className="advice-card" aria-labelledby="advice-heading">
      <h2 id="advice-heading">Personalised advice</h2>
      <fieldset>
        <legend>Who is this for?</legend>
        {DEFAULT_PROFILE_KEYS.map((profileKey) => (
          <label className="check" key={profileKey}>
            <input
              type="checkbox"
              checked={profile[profileKey]}
              onChange={(event) => onProfileChange(profileKey, event.target.checked)}
            />
            <span>{formatProfileLabel(profileKey)}</span>
          </label>
        ))}
      </fieldset>
      <ul>
        {advice.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </section>
  )
}
