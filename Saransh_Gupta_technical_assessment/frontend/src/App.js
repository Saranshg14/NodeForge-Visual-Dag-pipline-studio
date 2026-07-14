import { PipelineToolbar } from './toolbar';
import { PipelineUI } from './ui';
import { SubmitButton } from './submit';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';

function App() {
  useKeyboardShortcuts();

  return (
    <div className="vs-app">
      <header className="vs-header">
        <span className="vs-header__mark">Vector<em>Shift</em></span>
      </header>
      <PipelineToolbar />
      <PipelineUI />
      <SubmitButton />
    </div>
  );
}

export default App;
