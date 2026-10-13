import { Button } from '../atoms/Button';
import { Notice } from '../molecules/Notice';
import { ScreenTemplate } from './ScreenTemplate';
import { t } from '../../strings';

interface Props {
  children: React.ReactNode;
  submitLabel: string;
  onSubmit: () => void;
  submitting: boolean;
  /** Form-level message. Field messages sit beside their own control. */
  error?: string;
  /** Extra buttons or content below the submit button. */
  footerExtra?: React.ReactNode;
}

/** Form layout. Values stay in the screen's state, so a failure never clears them. */
export function FormTemplate({
  children,
  submitLabel,
  onSubmit,
  submitting,
  error,
  footerExtra,
}: Props) {
  return (
    <ScreenTemplate
      footer={
        <>
          {error ? <Notice icon="alert-circle" message={error} /> : null}
          <Button
            label={submitting ? t.common.saving : submitLabel}
            onPress={onSubmit}
            loading={submitting}
          />
          {footerExtra}
        </>
      }
    >
      {children}
    </ScreenTemplate>
  );
}
