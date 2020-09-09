import Web3 from "web3";

export class Config {
    public network: string = '';
    public web3: Web3 = new Web3();
    public contracts: any = null;
    public info: any;

    setConfig(config: any) {
        this.network = config.RPC_SERVER;
        this.web3 = new Web3(new Web3.providers.HttpProvider(this.network));
        this.contracts = config.CONTRACT;
        this.info = config;
    }
}

const localConfig = new Config();
export { localConfig }
