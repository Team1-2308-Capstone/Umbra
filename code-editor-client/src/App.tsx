// import "./App.css";
import { MainEditor } from "./components/MainEditor";
import OutputDisplay from "./components/OutputDisplay";
import { useState, useEffect } from "react";
import axios from "axios";

import { YDocProvider } from "@y-sweet/react";
import { ClientToken } from "@y-sweet/sdk";

function App() {
  const [code, setCode] = useState<string>(
    "console.log(2+2);\nconsole.log('hello world')"
  );
  const [output, setOutput] = useState<string>("");
  const [clientToken, setClientToken] = useState<ClientToken | null>(null);

  useEffect(() => {
    const fetchClientToken = async (doc: string) => {
      const response = await axios.get(
        `http://localhost:3001/get-token/${doc}`
      );
      setClientToken(response.data.clientToken);
    };

    const params = new URLSearchParams(window.location.search);
    const doc = params.get("doc") || "default";

    fetchClientToken(doc || "default");
  }, []);

  const CODE_EXECUTION_ENDPOINT = "https://ls-capstone-team1-code-execution-server.8amvljcm2giii.us-west-2.cs.amazonlightsail.com/run";

  const sendCode = async (code: string) => {
    const codeEndpoint = CODE_EXECUTION_ENDPOINT;
    console.log(`Sending code to ${codeEndpoint}, code: ${code}`);
    const response = await axios.post(codeEndpoint, {
      code: code,
    });
    console.log(`Response: ${JSON.stringify(response)}`);
    setOutput(JSON.stringify(response.data, null, 2));
  };

  return clientToken ? (
    <YDocProvider clientToken={clientToken} setQueryParam="doc">
      <h1>CodeShare</h1>
      <MainEditor code={code} setCode={setCode} />
      <button onClick={() => sendCode(code)}>Run Code</button>
      <OutputDisplay output={output} />
    </YDocProvider>
  ) : null;
}

export default App;
