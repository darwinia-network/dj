import Web3 from "web3";
import config from "config";

export interface IConfig {
  network: string
}

export class Config {
  static network: string = config.get("RPC_SERVER");
  static web3: Web3 = new Web3(new Web3.providers.HttpProvider(Config.network));
  static contracts: any = config.get("CONTRACT");
}
