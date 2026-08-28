import VeyitSite from './VeyitSite';
import { copy } from './copy';

export default function Home() {
  return <VeyitSite text={copy.en} />;
}
