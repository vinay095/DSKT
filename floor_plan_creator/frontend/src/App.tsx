import { Provider } from 'react-redux'
import { store } from './app/store'
import { FloorPlanEditor } from './components/floorplan/editor/FloorPlanEditor'

function App() {
  return (
    <Provider store={store}>
      <FloorPlanEditor />
    </Provider>
  )
}

export default App
