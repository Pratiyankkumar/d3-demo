import type { ComponentType } from "react";

type SceneModule = { default: ComponentType };

const sceneEntries = Object.entries(
  import.meta.glob<SceneModule>("./components/**/*.tsx", { eager: true }),
).sort(([a], [b]) => a.localeCompare(b));

function App() {
  return (
    <>
      {sceneEntries.map(([path, mod]) => {
        const Scene = mod.default;
        return <Scene key={path} />;
      })}
    </>
  );
}

export default App;
