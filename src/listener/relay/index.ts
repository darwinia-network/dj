import { ShadowAPI, API } from "../../api";
import { log } from "../../util";
import { DispatchError } from "@polkadot/types/interfaces/types";
import { ITx } from "../../types";

import approve from "./approve";
import relay from "./relay";

export function listen(api: API, shadow: ShadowAPI, queue: ITx[]) {
    relay(api, shadow, queue);

    // Subscribe to system events via storage
    api._.query.system.events((events: any) => {
        events.forEach(async (record: any) => {
            const { event, phase } = record;
            // const types = event.typeDef;

            switch (event.method) {
                case "GameOver":
                    log.event("GameOver");
                case "PendingHeaderApproved":
                    approve(event, phase, api, shadow, queue);
                case "NewRound":
                    // TODO
                    //
                    // Fix the Relayer Game API
                    // await newRound(event, phase, types, api, shadow);
            }

            if (event.data[0] && (event.data[0] as DispatchError).isModule) {
                log.err(api._.registry.findMetaError(
                    (event.data[0] as DispatchError).asModule.toU8a(),
                ));
            }
        });
    });
}
