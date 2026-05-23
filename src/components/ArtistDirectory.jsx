import * as React from "react"

import { normalizeTag } from "../lib/normalize-tag"
import "./ArtistDirectory.scss"

const MIN_FONT_SIZE = 0.8
const MAX_FONT_SIZE = 2.5

function getTagSize(count, minCount, maxCount) {
  if (minCount === maxCount) return (MIN_FONT_SIZE + MAX_FONT_SIZE) / 2
  const ratio = (count - minCount) / (maxCount - minCount)
  return MIN_FONT_SIZE + ratio * (MAX_FONT_SIZE - MIN_FONT_SIZE)
}

function ArtistDirectory({ artists }) {
  const [activeStyle, setActiveStyle] = React.useState(null)
  const [activeLocation, setActiveLocation] = React.useState(null)

  const styleCounts = {}
  const locationCounts = {}
  for (const entry of artists) {
    if (entry.styles) {
      for (const style of entry.styles) {
        const key = normalizeTag(style)
        styleCounts[key] = (styleCounts[key] || 0) + 1
      }
    }
    if (entry.locations) {
      for (const loc of entry.locations) {
        const key = normalizeTag(loc)
        locationCounts[key] = (locationCounts[key] || 0) + 1
      }
    }
  }

  const visibleStyles = Object.keys(styleCounts).filter((s) => styleCounts[s] > 1)
  const sortedStyles = visibleStyles.sort()
  const counts = visibleStyles.map((s) => styleCounts[s])
  const minCount = counts.length ? Math.min(...counts) : 1
  const maxCount = counts.length ? Math.max(...counts) : 1

  const visibleLocations = Object.keys(locationCounts).filter((l) => locationCounts[l] > 1)
  const sortedLocations = visibleLocations.sort()
  const locCounts = sortedLocations.map((l) => locationCounts[l])
  const locMinCount = locCounts.length ? Math.min(...locCounts) : 1
  const locMaxCount = locCounts.length ? Math.max(...locCounts) : 1

  const filteredArtists = artists.filter((entry) => {
    if (activeStyle && (!entry.styles || !entry.styles.some((s) => normalizeTag(s) === activeStyle))) return false
    if (activeLocation && (!entry.locations || !entry.locations.some((l) => normalizeTag(l) === activeLocation))) return false
    return true
  })

  const hasActiveFilter = activeStyle || activeLocation

  return (
    <div className="ArtistDirectory">
      <div className="ArtistDirectory-tags">
        {hasActiveFilter && (
          <button
            className="ArtistDirectory-tagPill"
            onClick={() => { setActiveStyle(null); setActiveLocation(null) }}
          >
            <span className="ArtistDirectory-tagLabel">✕ clear</span>
          </button>
        )}
        {sortedStyles.map((tag) => (
          <span
            key={tag}
            className={`ArtistDirectory-tagPill${tag === activeStyle ? " is-active" : ""}`}
          >
            <button
              className="ArtistDirectory-tagLabel"
              onClick={() => setActiveStyle(tag === activeStyle ? null : tag)}
              style={{
                fontSize: `${getTagSize(styleCounts[tag], minCount, maxCount)}rem`,
              }}
            >
              {tag}
              <span className="ArtistDirectory-tagCount">{styleCounts[tag]}</span>
            </button>
          </span>
        ))}
      </div>

      <div className="ArtistDirectory-artists">
        {filteredArtists.map((entry) => (
          <span key={entry.slug}>
            <strong>{entry.name}</strong>
          </span>
        ))}
      </div>

      {filteredArtists.length === 0 && (
        <p>No artists match the selected filters.</p>
      )}

      {sortedLocations.length > 0 && (
        <div className="ArtistDirectory-tags ArtistDirectory-tags--locations">
          {sortedLocations.map((tag) => (
            <span
              key={tag}
              className={`ArtistDirectory-tagPill ArtistDirectory-tagPill--location${tag === activeLocation ? " is-active" : ""}`}
            >
              <button
                className="ArtistDirectory-tagLabel"
                onClick={() => setActiveLocation(tag === activeLocation ? null : tag)}
                style={{
                  fontSize: `${getTagSize(locationCounts[tag], locMinCount, locMaxCount)}rem`,
                }}
              >
                {tag}
                <span className="ArtistDirectory-tagCount">{locationCounts[tag]}</span>
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export default ArtistDirectory
