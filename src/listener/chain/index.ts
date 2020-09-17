import { ShadowAPI, API } from "../../api";
import { log } from "../../util";
import { DispatchError } from "@polkadot/types/interfaces/types";
import game from "./game";

export function listen(api: API, shadow: ShadowAPI) {
    // Subscribe to system events via storage
    api._.query.system.events((events: any) => {
        events.forEach(async (record: any) => {
            const { event, phase } = record;
            const types = event.typeDef;

            // Chain events
            switch (event.method) {
                case "NewRound":
                    await game(event, phase, types, api, shadow);
            }

            if (event.data[0] && (event.data[0] as DispatchError).isModule) {
                log.err(api._.registry.findMetaError(
                    (event.data[0] as DispatchError).asModule.toU8a(),
                ));
            }
        });
    });
}
