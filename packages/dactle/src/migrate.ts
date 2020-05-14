import path from "path";
import os from "os";
import fs from "fs";
import Redis from "ioredis";
import { IBotScheme } from "./db/json";

; (async () => {
    const redis = new Redis();
    const home = os.homedir();
    const bobyPath = path.resolve(home, ".darwinia/cache/boby.json");
    const stream = fs.readFileSync(bobyPath).toString();
    const boby: IBotScheme = JSON.parse(stream);

    redis.sadd("_addrs", boby.addrs);
    const users = Object.keys(boby.users);
    for (const i in users) {
        redis.hmset("_users", [users[i], boby.users[Number(users[i])]]);
    }

    const supply = Object.keys(boby.supply);
    for (const i in supply) {
        redis.hmset("_supply", [supply[i], boby.supply[supply[i]]]);
    }

    console.log('done');
    process.exit(0);
})();
