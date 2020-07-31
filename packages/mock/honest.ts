import { log } from "../util";
import { proposal } from "../dj/src/proposal";

/// The normal proposal submitter
(async () => {
    log.event("This is the honest relayer");
    await proposal(19);
})();
