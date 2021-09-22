import clsx from 'clsx';
import { ComponentType } from 'react';

import {
  GitHub,
  IconPropsColor,
  ImageSC,
  Twitter,
  Zulip,
} from '@/components/icons';
import { Link } from '@/components/Link';

interface FooterItem {
  title: string;
  link: string;
  alt: string;
  icon: ComponentType<IconPropsColor>;
}

const FOOTER_LINKS: FooterItem[] = [
  {
    title: 'GitHub',
    link: 'https://github.com/napari/napari',
    alt: 'Visit GitHub repository',
    icon: GitHub,
  },
  {
    title: 'Twitter',
    link: 'https://twitter.com/napari-imaging',
    alt: 'Visit Twitter page',
    icon: Twitter,
  },
  {
    title: 'image.sc',
    link: 'https://image.sc',
    alt: 'Visit image.sc forum',
    icon: ImageSC,
  },
  {
    title: 'Zulip',
    link: 'https://image.sc',
    alt: 'Visit Zulip chatroom',
    icon: Zulip,
  },
];

const COMMON_STYLES =
  'whitespace-nowrap text-xs screen-450:text-sm text-white mr-6 last:mr-0';

function FooterLinks() {
  return (
    <>
      {FOOTER_LINKS.map((item) => (
        <Link
          className={clsx(COMMON_STYLES, 'flex flex-row items-center')}
          href={item.link}
          newTab
        >
          <item.icon
            className="inline-block mr-1 h-4 w-4"
            color="white"
            alt={item.alt}
          />
          {item.title}
        </Link>
      ))}
    </>
  );
}

export function Footer() {
  return (
    <div
      className={clsx(
        'flex flex-row items-center justify-start',
        'h-[4.6875em] w-full',
        'px-6 screen-450:px-12',
        'bg-black',
      )}
    >
      <Link className={COMMON_STYLES} href="https://napari-hub.org" newTab>
        napari <span className="font-semibold">hub</span>
      </Link>
      <FooterLinks />
    </div>
  );
}
