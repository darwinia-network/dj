import { log } from "../util";
import { uncle_proposal } from "../api/src/proposal_test";

/// The normal proposal submitter
(async () => {
    log.event("This is the uncle relayer");
    await uncle_proposal();
})();
