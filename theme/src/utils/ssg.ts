/* eslint-disable import/no-extraneous-dependencies */

import cheerio, { Cheerio, CheerioAPI, Element } from 'cheerio';
import parseFrontMatter from 'front-matter';
import fs from 'fs-extra';
import { last, pickBy } from 'lodash';
import { resolve } from 'path';
import {
  HTMLAttributeReferrerPolicy,
  LinkHTMLAttributes,
  ScriptHTMLAttributes,
} from 'react';

import {
  JupyterBookState,
  PageFrontMatterData,
  TOCHeader,
} from '@/context/jupyterBook';

import { isExternalUrl } from './url';

interface StackItem<T> {
  level: number;
  node: T;
  parentId?: string;
}

interface LinkData {
  href: string;
  text: string;
}

interface GetGlobalHeadersOptions<T> {
  /**
   * Gets the initial list of TOC tree nodes to parse.
   */
  getRootNodes(): T[];

  /**
   * Gets link data for some link under the given parent node.
   *
   * @param parentNode The parent node.
   */
  getLinkData(parentNode: T): LinkData;

  /**
   * Gets the next level of TOC tree nodes given some parent node and next level.
   *
   * @param parentNode The parent node.
   */
  getNextNodes(parentNode: T, level: number): T[];
}

/**
 * Utility function for getting global header data from a DOM tree. The function
 * is implemented generically enough so that it can be used on the browser and
 * by the pre-renderer. Since the DOM is a tree, we can use Depth First Search
 * to traverse the tree and deserialize it into the global headers data
 * structures.
 */
function getGlobalHeaders<T>({
  getRootNodes,
  getLinkData,
  getNextNodes,
}: GetGlobalHeadersOptions<T>) {
  const globalHeaders: Record<string, TOCHeader> = {};
  const rootGlobalHeaders: string[] = [];

  const stack: StackItem<T>[] = getRootNodes().map((node) => ({
    node,
    level: 1,
  }));

  while (stack.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const { level, node, parentId } = stack.pop()!;

    const link = getLinkData(node);

    if (link.href && link.text) {
      // Add new header mapped to the link URL.
      globalHeaders[link.href] = {
        level,
        children: [],
        href: link.href,
        text: link.text,
      };

      if (level === 1) {
        rootGlobalHeaders.push(link.href);
      }

      // Add current header as child of parent header.
      if (parentId) {
        globalHeaders[parentId].children?.push(link.href);
      }

      const nextLevel = level + 1;
      const nextNodes = getNextNodes(node, nextLevel);

      // Add next headers to the stack for processing.
      for (const nextNode of nextNodes) {
        stack.push({
          parentId: link.href,
          level: level + 1,
          node: nextNode,
        });
      }
    }
  }

  // Reverse header lists because stacks pop items in reverse.
  rootGlobalHeaders.reverse();
  for (const header of Object.values(globalHeaders)) {
    header.children?.reverse();
  }

  return {
    globalHeaders,
    rootGlobalHeaders,
  };
}

function getPageHeaders($: CheerioAPI) {
  return $('#page-toc')
    .find('#page-toc > ul > li > ul > li > a')
    .toArray()
    .map<TOCHeader>((element) => {
      const link = cheerio(element);
      const href = link.attr('href') ?? '';

      return {
        href,
        text: link.text(),
      };
    });
}

function getTocSelector(level = 1) {
  return `.toctree-l${level}`;
}

function getGlobalTocHeaders(globalToc: Cheerio<Element>) {
  return getGlobalHeaders<Element>({
    getRootNodes: () => globalToc.find(getTocSelector()).toArray(),
    getLinkData: (node) => {
      const link = cheerio(node).find('a').first();
      let href = link.attr('href') ?? '';

      // Add prefix to make URL absolute.
      if (!isExternalUrl(href)) {
        href = `/${href}`;
      }

      return {
        href,
        text: link.text(),
      };
    },
    getNextNodes: (node, level) =>
      cheerio(node).find(getTocSelector(level)).toArray(),
  });
}

const IGNORED_APP_SCRIPTS = ['_static/sphinx-book-theme'];

/**
 * Parses the page scripts HTML to retrieve the list of scripts required for the
 * page. This is so that whatever functionality added by extensions or the
 * search engine can be loaded and functioning properly.
 *
 * @param $ The cheerio instance.
 * @returns A list of script elements deserialized into script prop objects.
 */
function getAppScripts($: CheerioAPI, selector: string) {
  return $(selector)
    .toArray()
    .map((script) => cheerio(script))
    .filter((script) => {
      const src = script.attr('src');

      if (!src) {
        return true;
      }

      return IGNORED_APP_SCRIPTS.every((file) => !src.includes(file));
    })
    .map((script) => {
      // Parse React script props from script element.
      const props: ScriptHTMLAttributes<HTMLScriptElement> = {
        async: script.attr('async') === 'true' ? true : undefined,
        crossOrigin: script.attr('crossorigin'),
        defer: script.attr('defer') === 'true' ? true : undefined,
        integrity: script.attr('integrity'),
        noModule: script.attr('nomodule') === 'true' ? true : undefined,
        nonce: script.attr('nonce'),
        referrerPolicy: script.attr('referrerpolicy') as
          | HTMLAttributeReferrerPolicy
          | undefined,
        src: script.attr('src'),
        type: script.attr('type'),
      };

      // Make absolute URL.
      if (props.src && !isExternalUrl(props.src)) {
        props.src = `/_static/${props.src.replace(/^.*_static\//, '')}`;
      }

      // Add script content if it exists.
      const content = script.html();
      if (content) {
        props.children = content;
      }

      // Remove `undefined` keys so that Next.js can serialize the data as JSON.
      return pickBy(props, (value) => value !== undefined);
    });
}

const IGNORED_STYLE_SHEETS = ['_static/basic.css'];

function getAppStyleSheets($: CheerioAPI) {
  return $('link[rel=stylesheet]')
    .toArray()
    .map((linkElement) => cheerio(linkElement))
    .filter((link) => {
      const href = link.attr('href');

      return href && IGNORED_STYLE_SHEETS.every((file) => !href.includes(file));
    })
    .map((link) => {
      // Parse React link props from link element.
      const props: LinkHTMLAttributes<HTMLLinkElement> = {
        href: link.attr('href'),
        media: link.attr('media'),
        rel: link.attr('rel'),
        type: link.attr('type'),
      };

      // Make absolute URL.
      if (props.href && !isExternalUrl(props.href)) {
        props.href = `/_static/${props.href.replace(/^.*_static\//, '')}`;
      }

      // Remove `undefined` keys so that Next.js can serialize the data as JSON.
      return pickBy(props, (value) => value !== undefined);
    });
}

const SEARCH_PAGE_SELECTOR_REMOVE_LIST = [
  // Footer can be removed since the napari theme already has a footer.
  '.footer',

  // Links to index pages. This can be removed since we handle rendering the TOC.
  '.related',

  // Sidebar for rendering logo, which is not required for the theme.
  '.sphinxsidebar',

  // napari theme handles rendering h1 header.
  'h1#search-documentation',

  // Removes unnecessary text node about multiple matches.
  '.body > p:nth-child(2)',

  // Removes script used for removing the fallback so that we can remove it
  // directly. This is because the script is embedded in the `<body>` and
  // requires jQuery, but jQuery isn't loaded until later.
  '#fallback > script',
];

const ROOT_DIR = resolve(__dirname, '../../..');
const BUILD_DIR = resolve(ROOT_DIR, '_build/html');

interface RawFrontMatterData {
  theme?: PageFrontMatterData;
}

async function getPageFrontMatter(file: string) {
  // Get corresponding markdown file from HTML file.
  const markdownFile = resolve(
    ROOT_DIR,
    file.replace(`${BUILD_DIR}/`, '').replace('.html', '.md'),
  );

  if (await fs.pathExists(markdownFile)) {
    const mdData = await fs.readFile(markdownFile, 'utf-8');

    return parseFrontMatter<RawFrontMatterData>(mdData).attributes.theme ?? {};
  }

  return {};
}

/**
 * Scrapes page data from an HTML file for pre-rendering.
 *
 * @param file The HTML file to extract data from.
 */
export async function getPageData(file: string): Promise<JupyterBookState> {
  // Load global TOC from index.html file to get consistent TOC links.
  const indexFile = resolve(BUILD_DIR, 'index.html');
  const indexHtml = await fs.readFile(indexFile, 'utf-8');
  const globalToc = cheerio.load(indexHtml)('#global-toc');

  const rawHtml = await fs.readFile(file, 'utf-8');
  const $ = cheerio.load(rawHtml);

  let result: JupyterBookState;

  // The search page requires separate pre-processing of data for rendering.
  const isSearch = last(file.split('/')) === 'search.html';

  if (isSearch) {
    const pageBody = $('body');

    SEARCH_PAGE_SELECTOR_REMOVE_LIST.forEach((selector) =>
      pageBody.find(selector).remove(),
    );

    // While the form isn't required since we have the app search bar, we need
    // to keep it to leverage the existing search functionality. So instead of
    // removing it, we render it invisible in the DOM.
    pageBody.find('form').attr('style', 'display: none');

    result = {
      ...getGlobalTocHeaders(globalToc),
      pageTitle: 'Search',
      appScripts: getAppScripts($, 'head script'),
      appStyleSheets: getAppStyleSheets($),
      pageBodyHtml: pageBody.html() ?? '',
      pageHeaders: [],
      pageFrontMatter: {},
    };
  } else {
    const pageBody = $('#page-body');

    // Remove header link automatically added by Jupyter Book.
    pageBody.find('.headerlink').remove();

    // Get page title from header text content.
    const pageHeader = pageBody.find('h1').first();
    const pageTitle = pageHeader.text();
    pageHeader.remove();

    result = {
      ...getGlobalTocHeaders(globalToc),
      pageTitle,
      pageFrontMatter: await getPageFrontMatter(file),
      appScripts: getAppScripts($, '#scripts script'),
      appStyleSheets: getAppStyleSheets($),
      pageBodyHtml: pageBody.html() ?? '',
      pageHeaders: getPageHeaders($),
    };
  }

  return result;
}
