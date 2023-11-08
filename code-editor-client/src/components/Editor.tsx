import {
  useRef,
  useEffect,
  useCallback,
  useMemo,
  Dispatch,
  SetStateAction,
} from "react";
import * as random from "lib0/random";

// UI related
import { Box, Button, Select, Image, Tooltip } from "@chakra-ui/react";

// Image icons
import python_icon from "../assets/python_icon.png";
import js_icon from "../assets/js_icon.png";
import ts_icon from "../assets/ts_icon.png";
import rb_icon from "../assets/rb_icon.png";
import go_icon from "../assets/go_icon.png";

// CM6 core modules
import { basicSetup } from "codemirror";
import { EditorState } from "@codemirror/state";
import { EditorView, ViewUpdate, keymap } from "@codemirror/view";

// CM6 editor options
import { vscodeDark } from "@uiw/codemirror-theme-vscode";
import { defaultKeymap, indentWithTab, history } from "@codemirror/commands";
import { javascript, typescriptLanguage } from "@codemirror/lang-javascript";
import { StreamLanguage } from "@codemirror/language";
import { python } from "@codemirror/legacy-modes/mode/python";
import { ruby } from "@codemirror/legacy-modes/mode/ruby";
import { go } from "@codemirror/legacy-modes/mode/go";

// yjs and associates
import * as Y from "yjs";
import { yCollab } from "y-codemirror.next";
import { useAwareness, useText } from "@y-sweet/react";

// Awareness consts
const usercolors = [
  { color: "#30bced", light: "#30bced33" },
  { color: "#6eeb83", light: "#6eeb8333" },
  { color: "#ffbc42", light: "#ffbc4233" },
  { color: "#ecd444", light: "#ecd44433" },
  { color: "#ee6352", light: "#ee635233" },
  { color: "#9ac2c9", light: "#9ac2c933" },
  { color: "#8acb88", light: "#8acb8833" },
  { color: "#1be7ff", light: "#1be7ff33" },
];

const adjectives = [
  "Suburban",
  "Urban",
  "Rural",
  "Mountain",
  "River",
  "Ocean",
  "Forest",
  "Desert",
  "Arctic",
  "Tropical",
  "Gnarly",
  "Blue",
  "Honest",
];
const nouns = [
  "Eagle",
  "Lion",
  "Bear",
  "Shark",
  "Tiger",
  "Elephant",
  "Wolf",
  "Fox",
  "Deer",
  "Owl",
  "Pilgrim",
  "Sentinel",
  "Scion",
];

function generateRandomName(): string {
  // Check if a name already exists in local storage
  const storedName = localStorage.getItem("codeeditor-username");
  if (storedName) {
    // If a name exists, return it
    return storedName;
  }
  const randomAdjective =
    adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
  const newName = `${randomAdjective} ${randomNoun}`;

  localStorage.setItem("codeeditor-username", newName);

  return newName;
}

// state setter for editor view
type SetEditorViewRef = (
  viewRef: React.MutableRefObject<EditorView | undefined>
) => void;

// Editor component
export type EditorProps = {
  onChange: (value: string) => void;
  setEditorViewRef: SetEditorViewRef;
  onClick: () => void;
  orientation: "horizontal" | "vertical";
  setOrientation: Dispatch<SetStateAction<"horizontal" | "vertical">>;
  language: string;
  setLanguage: Dispatch<SetStateAction<string>>; // eventually narrow this type to specific language identifiers
  width: string;
  height: string;
};

const languageIconMap = {
  js: js_icon,
  ts: ts_icon,
  rb: rb_icon,
  go: go_icon,
  py: python_icon,
};

const getLanguageMode = (language: string) => {
  switch (language) {
    case 'js':
      return javascript();
    case 'ts':
      return typescriptLanguage;
    case 'py':
      return StreamLanguage.define(python);
    case 'go':
      return StreamLanguage.define(go);
    case 'rb':
      return StreamLanguage.define(ruby);
    default:
      return javascript();
  }
};

export const Editor: React.FC<EditorProps> = ({
  onChange,
  setEditorViewRef,
  onClick,
  orientation,
  setOrientation,
  language,
  setLanguage,
  width,
  height,
}) => {
  // console.log("Editor RERENDERING");
  // We want editorRef to be a mutable instance of EditorView, so we use useRef
  const editorRef = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView>();

  const yText = useText("input", { observe: "none" });

  // Create an UndoManager for the shared text type
  const undoManager = new Y.UndoManager(yText);

  const awareness = useAwareness();
  const userColor = usercolors[random.uint32() % usercolors.length];

  const toggleOrientation = () => {
    setOrientation((prev) =>
      prev === "horizontal" ? "vertical" : "horizontal"
    );
  };

  useEffect(() => {
    setEditorViewRef(view);
  });

  useEffect(() => {
    if (awareness) {
      awareness.setLocalStateField("user", {
        name: generateRandomName() + " " + Math.floor(Math.random() * 100),
        color: userColor.color,
        colorLight: userColor.light,
      });
    }
    console.log(`awareness: ${awareness}`);
  }, [awareness]);

  const onUpdate = useCallback(
    (v: ViewUpdate) => {
      if (v.docChanged) {
        onChange(v.state.doc.toString());
      }
    },
    [onChange]
  );

  const updateListener = EditorView.updateListener.of(onUpdate);

  const theme = useMemo(
    () =>
      EditorView.theme({
        "&": {
          width,
          height,
        },
      }),
    [width, height]
  );



  useEffect(() => {
    if (!editorRef.current) return;

    // initializes CodeMirror editor
    const state = EditorState.create({
      doc: yText.toString(),
      extensions: [
        basicSetup,
        history(),
        keymap.of([...defaultKeymap, indentWithTab]),
        vscodeDark,
        theme,
        updateListener,
        getLanguageMode(language),
        yCollab(yText, awareness, { undoManager }),
      ],
    });

    // renders the CodeMirror editor in the browser; sets the parent element to the div that holds the ref
    view.current = new EditorView({ state, parent: editorRef.current });

    // cleanup function
    return () => {
      if (view.current) {
        view.current.destroy();
        view.current = undefined;
      }
    };
  }, [width, height, language]);

  return (
    <Box flex='1' bg='gray.900' p={3} borderRadius='5' overflow='auto'>
      {/* <Heading size='md' mb='3' color='white'>
        Code Editor
      </Heading> */}
      <div ref={editorRef} />
      {/* <Box display='flex' justifyContent='flex-start'>
        <Button marginTop='2'>
         Test 
        </Button>
      </Box> */}

      <Box display='flex' justifyContent='space-between'>

        <Box display='flex' alignItems='center'>
        <Button
          color='white'
          size='sm'
          bg='#0096FF'
          // borderRadius='20'
          _hover={{ bg: "#04BCF9" }}
          onClick={onClick}
          marginTop='2'
          marginRight='2'
        >
          Run
        </Button>
          <Select
            marginTop='2'
            width='3mu'
            size='sm'
            onChange={(event) => setLanguage(event.target.value)}
            textColor={"gray.300"}
            iconColor={"gray.300"}
            borderColor={"gray.600"}
          >
            <option value='js'>JavaScript</option>
            <option value='ts'>TypeScript</option>
            <option value='py'>Python</option>
            <option value='go'>Golang</option>
            <option value='rb'>Ruby</option>
          </Select>
          <Image
            src={languageIconMap[language]}
            boxSize='32px'
            alt='Code Language Icon'
            ml={2}
            mt={2}
          />
        </Box>
        <Box>
          <Tooltip label='Change Editor Orientation'>
          <Button 
            size='sm' 
            marginTop='2' 
            onClick={toggleOrientation}
            bg='#0096FF'
            border='1px black'
            marginRight='1'
            _hover={{ bg: "umbra.deepSkyBlue" }}
          >
          { orientation === "horizontal" ? 
          <svg width="1em" height="1em" viewBox="0 0 16 16" fill="white" xmlns="http://www.w3.org/2000/svg">
            <path  fillRule="evenodd" d="M14 2H2a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1zM2 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2H2z"/>
            <path fillRule="evenodd" d="M7.5 14V2h1v12h-1z"/>
          </svg>
          :
          <svg width="1.25em" height="1.25em" viewBox="0 0 16 16" fill="white">
            <path d="M14 1H3L2 2v11l1 1h11l1-1V2l-1-1zm0 12H3V8h11v5zm0-6H3V2h11v5z"/>
          </svg>
          }
          </Button>
          </Tooltip>
        </Box>
      </Box>
    </Box>
  );
};
