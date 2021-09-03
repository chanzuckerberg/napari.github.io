import { hydrate, render } from 'react-dom';
import Helmet from 'react-helmet';

import { App } from '@/components/App';
import { mediaStyles } from '@/components/media';
import { PROD } from '@/constants/env';
import { JupyterBookProvider } from '@/context/jupyterBook';

const body = document.querySelector('body');
body?.classList.remove('no-js');

function Main() {
  return (
    <>
      {!PROD && (
        <Helmet>
          {/*
            Client side fresnel styles need to be injected for development. The
            styles are pre-rendered into the HTML for production.
          */}
          <style>{mediaStyles}</style>
        </Helmet>
      )}

      <JupyterBookProvider>
        <App />
      </JupyterBookProvider>
    </>
  );
}

// Use `hydrate()` in production so that React can use the already existing
// nodes from pre-rendering. For development, the app node is empty, so we can
// use `render()` instead
const renderFn = PROD ? hydrate : render;
renderFn(<Main />, document.getElementById('app'));
