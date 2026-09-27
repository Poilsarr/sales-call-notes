/**
 * ProofStrip — deprecated shim (GAUGE-REDESIGN-PART1-PLAN E1).
 * TrustStrip is the live strip; this re-export keeps old imports green.
 */
import TrustStrip from "./trust-strip";

export const ProofStrip = TrustStrip;
export default TrustStrip;
