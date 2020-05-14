import { RDb } from "@darwinia/dactle/src/db";

// Addrs
test("Test addrs", async () => {
    const redis = new RDb();
    const addrs = [
        "5CRABDGPE9XKM4TSZneAG3vvyPLpiZj3Mw4fnfSYVqsVRDit",
        "5CRAB3QUL56xNQKUW16FrHEQo3B7giiNT9yKCEfUPfUMf12f",
        "5CRABS4hMeHNjTcwTWRFzkPhD8NYPZdkBcdNfR7T6bkV8YD8"
    ]

    // add addrs
    for (const i in addrs) {
        await redis.addAddr(addrs[i]);
    }

    // check addrs
    for (const i in addrs) {
        expect(await redis.hasReceived(addrs[i])).toEqual(true);
    }

    return;
});

// User Interval
test("Test users", async () => {
    const redis = new RDb();
    const users = [0, 1, 2];

    // add users
    for (const i in users) {
        await redis.lastDrop(users[i], new Date().getTime())
    }

    // check users
    for (const i in users) {
        expect(await redis.nextDrop(users[i], 24)).toEqual(23)
    }

    return;
});

// Supplies
test("Test Supply", async () => {
    const redis = new RDb();
    const date = new Date().toJSON().slice(0, 10);

    // fill supply today
    await redis._.set(`_supply_${date}`, 400);

    // check supply
    for (let i = 0; i < 200; i++) {
        await redis.burnSupply(date, 400)
    }
    expect(await redis.hasSupply(date, 400)).toEqual(true);

    // Second check
    for (let i = 0; i < 200; i++) {
        await redis.burnSupply(date, 400)
    }
    expect(await redis.hasSupply(date, 400)).toEqual(false);
});
