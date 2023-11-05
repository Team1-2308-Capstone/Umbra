import { Editor } from "./components/Editor";
import OutputDisplay from "./components/OutputDisplay";
import React, { useState, useEffect} from "react";
import axios from "axios";

import { Flex, Box } from "@chakra-ui/react";
import { EditorView } from "codemirror";
import LibraryDrawer from "./components/LibraryDrawer";

// icons
import { Image } from "@chakra-ui/react";
import horizontal from "./assets/horizontal.png";
import vertical from "./assets/vertical.png";

import { useDisclosure } from "@chakra-ui/react";
import MainHeader from "./components/MainHeader";

const CODE_EXECUTION_ENDPOINT = import.meta.env.VITE_CODE_EXECUTION_ENDPOINT;
console.log(import.meta.env);

interface AppProps {
  ySweetClientToken: string;
  user?: any;
  setUser: Function;
}

function App({ ySweetClientToken, user, setUser }: AppProps) {
  const [code, setCode] = useState<string>("");
  const [output, setOutput] = useState<string>("");
  const [orientation, setOrientation] = useState<"horizontal" | "vertical">(
    "horizontal"
  );

  const [editorHeight, setEditorHeight] = useState("45vh");
  const [outputHeight, setOutputHeight] = useState("20vh");
  const [editorWidth, setEditorWidth] = useState("60vw");
  const [outputWidth, setOutputWidth] = useState("60vw");

  useEffect(() => {
    if (orientation === "horizontal") {
      setEditorHeight("45vh");
      setOutputHeight("20vh");
      setEditorWidth("60vw");
      setOutputWidth("60vw");
    } else {
      setEditorHeight("70vh");
      setOutputHeight("70vh");
      setEditorWidth("40vw");
      setOutputWidth("40vw");
    }
  }, [orientation]);

  // Modal actions for Snippet Library
  const {
    isOpen: isLibraryOpen,
    onClose: onLibraryClose,
    onOpen: onLibraryOpen,
  } = useDisclosure();

  // Modal actions for Login Form
  const {
    onOpen: onLoginOpen,
    onClose: onLoginClose,
    isOpen: isLoginOpen,
  } = useDisclosure();

  // state to hold a reference to the code editor window
  const [editorViewRef, setEditorViewRef] = useState<
    React.MutableRefObject<EditorView | undefined>
  >({ current: undefined });

  const CODE_EXECUTION_ROUTE = "/api/runCode";

  // function to replace entire editor view state
  const replaceEditorContent = (newContent: string) => {
    console.log(editorViewRef);
    if (editorViewRef?.current) {
      const transaction = editorViewRef.current.state.update({
        changes: {
          from: 0,
          to: editorViewRef.current.state.doc.length,
          insert: newContent,
        },
      });
      editorViewRef.current.dispatch(transaction);
    }
  };

  const appendEditorContent = (newContent: string) => {
    if (editorViewRef?.current) {
      const docLength = editorViewRef.current.state.doc.length;
      const transaction = editorViewRef.current.state.update({
        changes: [{ from: docLength, insert: "\n" + newContent + "\n" }],
      });
      editorViewRef.current.dispatch(transaction);
    }
  };

  const sendCode = async (code: string) => {
    console.log(`Sending code to ${CODE_EXECUTION_ROUTE}, code: ${code}`);

    const response = await axios.post(CODE_EXECUTION_ROUTE, {
      language: "deno",
      version: "1.32.3",
      files: [
        {
          content: code,
        },
      ],
    });
    console.log(`Response: ${JSON.stringify(response)}`);
    console.log(`output is ${response.data.run.stdout}`);
    setOutput(JSON.stringify(response.data.run));
  };

  const orientationIcon = () => {
    return orientation === "horizontal" ? (
      <Image bg='white' boxSize='20px' src={vertical} />
    ) : (
      <Image bg='white' boxSize='20px' src={horizontal} />
    );
  };

  return ySweetClientToken ? (
    <Flex
      direction={"column"}
      minH='100vh'
      bg='#FFFFFF'
      justify='space-between'
    >
      <Flex direction='column'>
        <MainHeader
          user={user}
          setUser={setUser}
          replaceEditorContent={replaceEditorContent}
          appendEditorContent={appendEditorContent}
          onLibraryOpen={onLibraryOpen}
          onLoginOpen={onLoginOpen}
          onLoginClose={onLoginClose}
          isLoginOpen={isLoginOpen}
        />
      </Flex>
      <Flex
        direction={orientation === "horizontal" ? "column" : "row"}
        p={6}
        gap={3}
        // bgGradient='linear(to-r, black, gray.100, blue.800)'
        bg='white'
        align='center'
        maxWidth='75%'
        // width='90%'
        justifyContent='center'
        margin='auto'
      >
        <Box>
          <Editor
            setEditorViewRef={setEditorViewRef}
            onChange={setCode}
            onClick={() => sendCode(code)}
            orientation={orientation}
            setOrientation={setOrientation}
            orientationIcon={orientationIcon()}
            width={editorWidth}
            height={editorHeight}
          />
        </Box>
        <Box>
          <OutputDisplay
            orientation={orientation}
            width={outputWidth}
            height={outputHeight}
            output={output}
          />
        </Box>
      </Flex>
      <LibraryDrawer
        user={user}
        placement={"right"}
        onClose={onLibraryClose}
        isOpen={isLibraryOpen}
        size={"lg"}
        appendEditorContent={appendEditorContent}
        editorViewRef={editorViewRef}
      />
    </Flex>
  ) : null;
}

export default App;
