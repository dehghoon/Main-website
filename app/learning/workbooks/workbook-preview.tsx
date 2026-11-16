'use client';

import { useState } from 'react';
import { localWorkbookPreview } from '@/lib/workbooks/previews';
import styles from './workbooks.module.css';

const previewCopy = {
  worksheet: { alt: 'Read-only worksheet excerpt', caption: 'Read-only worksheet excerpt.' },
  outline: { alt: 'Illustrated worksheet guide', caption: 'Illustrated guide with selected workbook labels. A worksheet image is unavailable for this file.' },
  topic: { alt: 'Illustrated workbook topic overview', caption: 'Illustrated topic overview. A worksheet image is unavailable for this file.' },
};

type Props = { id: string; privatePreview?: string; thumbnail?: boolean };

export default function WorkbookPreview({ id, privatePreview, thumbnail = false }: Props) {
  const [failedPrivatePreview, setFailedPrivatePreview] = useState<string>();
  const local = localWorkbookPreview(id);
  if (!local) return null;

  const remote = privatePreview !== failedPrivatePreview ? privatePreview : undefined;
  const src = remote ?? local.src;
  const { alt, caption } = previewCopy[remote ? 'worksheet' : local.kind];
  const image = (
    <img src={src} alt={thumbnail ? '' : alt}
      loading={thumbnail ? 'lazy' : undefined}
      decoding="async"
      onError={remote ? () => setFailedPrivatePreview(remote) : undefined} />
  );

  if (thumbnail) return <div className={styles.thumbnail}>{image}</div>;

  return (
    <figure className={styles.preview}>
      {image}
      <figcaption>
        {caption}
        {' '}<a href={src} target="_blank" rel="noopener noreferrer">View full-size image</a>
      </figcaption>
    </figure>
  );
}
