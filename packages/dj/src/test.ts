import axios from "axios";

(async () => {
    const r = await axios.post("http://localhost:3000", {
        method: "shadow_getEthHeaderWithProofByNumber",
        params: {
            block_num: 0,
            id: 0,
            format: "json"
        }
    })

    console.log(JSON.stringify(r.data, null, 2));
})();
