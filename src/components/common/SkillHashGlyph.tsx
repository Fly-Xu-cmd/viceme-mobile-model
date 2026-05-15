import type { CSSProperties } from "react"

function fnv1a32(s: string): number {
  let h = 2166136261 >>> 0
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619) >>> 0
  }
  return h >>> 0
}

const PETAL_PATHS: readonly string[] = [
  "M69.02 55.02L103 66L101.715 78L55 79L69 55Z",
  "M67.02 79.02C60.3726 79 55 73.6274 55 67C55 60.3726 60.3726 55 67 55H91C97.6274 55 103 60.3726 103 67C103 73.6274 97.6274 79 91 79H67Z",
  "M55.02 79.02V75C55 63.9543 63.9543 55 75 55H103V59C103 70.0457 94.0457 79 83 79H55Z",
  "M55.02 79.02V75C55 63.9543 63.9543 55 75 55H83C94.0457 55 103 63.9543 103 75V79H55Z",
  "M67 79.02C65.3465 79 63.7898 78.685 62.3298 78.055C60.8698 77.425 59.5982 76.5683 58.515 75.4849C57.4316 74.4017 56.5749 73.1301 55.9449 71.6701C55.3149 70.2101 54.9999 68.6534 54.9999 67C54.9999 65.34 55.3149 63.7817 55.9449 62.3251C56.5749 60.8683 57.4316 59.5983 58.515 58.5151C59.5982 57.4317 60.8698 56.575 62.3298 55.945C63.7898 55.315 65.3465 55 66.9999 55C68.6599 55 70.2182 55.315 71.6748 55.945C73.1316 56.575 74.4016 57.4317 75.4848 58.5151C76.5682 59.5983 77.4249 60.8683 78.0549 62.3251C78.6849 63.7817 78.9999 65.34 78.9999 67C78.9999 68.6534 78.6849 70.2101 78.0549 71.6701C77.4249 73.1301 76.5682 74.4017 75.4848 75.4849C74.4016 76.5683 73.1316 77.425 71.6748 78.055C70.2182 78.685 68.6599 79 66.9999 79ZM66.9999 74.4601C69.0799 74.4601 70.8432 73.7367 72.2898 72.2899C73.7366 70.8433 74.46 69.08 74.46 67C74.46 64.92 73.7366 63.1567 72.2898 61.7101C70.8432 60.2633 69.0799 59.5399 66.9999 59.5399C64.9199 59.5399 63.1566 60.2633 61.71 61.7101C60.2632 63.1567 59.5398 64.92 59.5398 67C59.5398 69.08 60.2632 70.8433 61.71 72.2899C63.1566 73.7367 64.9199 74.4601 66.9999 74.4601Z",
  "M63.42 79.02V71.8H70.6V79H63.4ZM55 70.6V63.4H62.2V70.6H55ZM63.4 70.6V63.4H70.6V70.6H63.4ZM71.8 70.6V63.4H79V70.6H71.8ZM71.8 62.2V55H79V62.2H71.8Z",
  "M55.02 79.02L78 55H92.3333C98.2244 55 103 59.7756 103 65.6667C103 73.0305 97.0305 79 89.6667 79H55Z",
  "M91.02 55.02C97.6274 55 103 60.3726 103 67C103 73.6274 97.6274 79 91 79H71.6211C68.3499 79 65.2204 77.6645 62.957 75.3027L55 67L62.957 58.6973C65.2204 56.3355 68.3499 55 71.6211 55H91Z",
]

const NORMALIZE_SCALES: readonly number[] = [
  0.894, 0.894, 0.894, 0.894, 1.414, 1.414, 0.894, 0.894,
]

const FILLS: readonly string[] = [
  "#D7733E", "#CF9D29", "#53B46E", "#6C7DDF", "#648EE9",
  "#CD81E2", "#E25555", "#2FA594", "#C27A3A", "#5B7FD1",
  "#D96B4A", "#4A9B7F", "#8B6FD6", "#DF6A35", "#3D8AB8",
]

const PETAL_COUNT = 9
const STEP_DEG = 360 / PETAL_COUNT
const VIEW = 110
const CX = 55
const CY = 55

export function SkillHashGlyph({
  seedText,
  size = 36,
}: {
  seedText: string
  size?: number
}) {
  const h = fnv1a32(seedText)
  const pathIndex = h % PETAL_PATHS.length
  const pathD = PETAL_PATHS[pathIndex]!
  const fill = FILLS[(h >>> 8) % FILLS.length]!
  const normalizeScale = NORMALIZE_SCALES[pathIndex]!

  const rotations = Array.from({ length: PETAL_COUNT }, (_, i) => i * STEP_DEG)
  const normTransform = `translate(${CX} ${CY}) scale(${normalizeScale}) translate(${-CX} ${-CY})`

  const spinStyle: CSSProperties = {
    transformOrigin: `${size / 2}px ${size / 2}px`,
    mixBlendMode: "multiply",
  }

  return (
    <div
      className="relative flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full"
      style={{ width: size, height: size, backgroundColor: "#EBEBEB" }}
      aria-hidden
    >
      <div
        className="ai-icon-spin-hover flex h-full w-full items-center justify-center"
        style={spinStyle}
      >
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${VIEW} ${VIEW}`}
          className="block max-h-full max-w-full overflow-visible"
          style={{ isolation: "isolate", shapeRendering: "geometricPrecision" }}
        >
          <g transform={normTransform}>
            {rotations.map((deg) => (
              <g
                key={deg}
                style={{
                  mixBlendMode: "multiply",
                  transform: `scale(1) rotate(${deg}deg)`,
                  transformOrigin: "center center",
                }}
              >
                <path
                  d={pathD}
                  fill={fill}
                  fillRule="evenodd"
                  clipRule="evenodd"
                  style={{ mixBlendMode: "multiply" }}
                />
              </g>
            ))}
          </g>
        </svg>
      </div>
    </div>
  )
}
