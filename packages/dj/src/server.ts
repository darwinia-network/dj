import * as Koa from "koa";
import { Config } from "@darwinia/util";
import Fetcher from "./fetcher";


class Server {
    public koa: Koa;
    public conf: Config;
    public port: number;
    public fetcher: Fetcher;

    public async new() {

    }

    constructor(conf: Config) {
        const koa = new Koa();

        this.conf = conf;
        this.koa = koa;
    }
}

