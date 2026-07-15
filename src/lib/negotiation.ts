// Pure functions for negotiation coach. Benchmarks from PRD §7.12, refreshed quarterly.

export interface CompBenchmark {
  company: string
  level: string
  minCr: number  // in Crore INR
  maxCr: number
}

export const COMP_BENCHMARKS: CompBenchmark[] = [
  { company: 'Amazon India', level: 'L7', minCr: 1.5, maxCr: 2.3 },
  { company: 'Google India', level: 'Senior PM', minCr: 1.3, maxCr: 2.2 },
  { company: 'Uber India', level: 'Lead PM', minCr: 1.4, maxCr: 2.1 },
  { company: 'Microsoft India', level: 'Principal PM (L65)', minCr: 0.8, maxCr: 1.5 },
  { company: 'Experian India', level: 'Principal PM', minCr: 1.0, maxCr: 1.6 },
  { company: 'ServiceNow India', level: 'Sr Staff PM', minCr: 1.1, maxCr: 1.7 },
]

export function getBenchmark(company: string): CompBenchmark | null {
  const c = company.toLowerCase()
  return COMP_BENCHMARKS.find(b => b.company.toLowerCase().includes(c.split(' ')[0])) ?? null
}

export function getTotalComp(baseInr: number, bonusInr: number, rsuInr: number, joiningBonusInr: number): number {
  return baseInr + bonusInr + rsuInr + joiningBonusInr
}

export function croreToInr(cr: number): number {
  return Math.round(cr * 10_000_000)
}

export function inrToCrore(inr: number): number {
  return inr / 10_000_000
}

export function formatCrore(inr: number): string {
  const cr = inrToCrore(inr)
  if (cr >= 1) return `₹${cr.toFixed(2)}Cr`
  const lakh = inr / 100_000
  return `₹${lakh.toFixed(0)}L`
}

export interface CounterRange {
  lowInr: number
  highInr: number
  targetInr: number
  percentAboveOffer: number
}

export function computeCounterRange(
  offerTotalInr: number,
  benchmark: CompBenchmark | null
): CounterRange {
  // Ask for 15% above offer as the target, 20% as the high anchor
  const targetInr = Math.round(offerTotalInr * 1.15)
  const highInr = Math.round(offerTotalInr * 1.20)
  const lowInr = Math.round(offerTotalInr * 1.08)

  // If benchmark exists, cap counter at benchmark max
  if (benchmark) {
    const benchmarkMaxInr = croreToInr(benchmark.maxCr)
    return {
      lowInr,
      highInr: Math.min(highInr, benchmarkMaxInr),
      targetInr: Math.min(targetInr, benchmarkMaxInr),
      percentAboveOffer: 15,
    }
  }

  return { lowInr, highInr, targetInr, percentAboveOffer: 15 }
}

export function getBatnaFraming(
  offerCompany: string,
  benchmark: CompBenchmark | null
): string {
  const base = `Your BATNA: continue at Amazon (L6, Hyderabad) while applying to other Principal PM roles.`
  if (!benchmark) return base

  const benchmarkMid = croreToInr((benchmark.minCr + benchmark.maxCr) / 2)
  return `${base} Market midpoint for ${benchmark.level} at ${benchmark.company} is ${formatCrore(benchmarkMid)} — use this as your anchor.`
}

export function getCounterEmailAnchor(
  offerTotalInr: number,
  benchmark: CompBenchmark | null,
  counter: CounterRange
): string {
  if (benchmark) {
    return `based on current market data for ${benchmark.level} roles in Hyderabad (${formatCrore(croreToInr(benchmark.minCr))} to ${formatCrore(croreToInr(benchmark.maxCr))}), I am targeting ${formatCrore(counter.targetInr)} total compensation`
  }
  return `given my experience leading platform products at Amazon Transportation scale, I am targeting ${formatCrore(counter.targetInr)} total compensation`
}
