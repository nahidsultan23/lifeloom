import { fireEvent, render, screen } from '@testing-library/react-native';
import { Button } from '../src/components/atoms/Button';
import { ConfirmDialog } from '../src/components/molecules/ConfirmDialog';
import { PhotoFramePreview } from '../src/components/molecules/PhotoFramePreview';
import { TextField } from '../src/components/molecules/TextField';
import { LIMITS } from '../src/lib/limits';

describe('TextField', () => {
  it('shows the counter, enforces the limit, and shows its own error', async () => {
    const onChange = jest.fn();
    await render(<TextField label="Title" value="abc" onChangeText={onChange} maxLength={LIMITS.goalTitle} error="Give your goal a title." />);
    expect(screen.getByText('3 / 120')).toBeTruthy();
    expect(screen.getByText('Give your goal a title.')).toBeTruthy();
    const input = screen.getByLabelText('Title');
    expect(input.props.maxLength).toBe(120);
    await fireEvent.changeText(input, 'abcd');
    expect(onChange).toHaveBeenCalledWith('abcd');
  });

  it('uses the long limit for the letter body', async () => {
    await render(<TextField label="Your letter" value="" onChangeText={() => undefined} maxLength={LIMITS.letterBody} multiline />);
    expect(screen.getByLabelText('Your letter').props.maxLength).toBe(10000);
  });
});

describe('PhotoFramePreview', () => {
  it.each([
    ['letter', '4:3'],
    ['memory', '4:3'],
    ['what-if', '4:3'],
    ['avatar', '1:1'],
  ] as const)('states the required ratio for %s', async (purpose, label) => {
    await render(<PhotoFramePreview uri="file:///x.jpg" width={1000} height={500} purpose={purpose} />);
    expect(screen.getByText(new RegExp(`Required ratio ${label}`))).toBeTruthy();
    expect(screen.getByLabelText(`Preview framed at ${label}`)).toBeTruthy();
  });
});

describe('ConfirmDialog', () => {
  it('confirms and cancels', async () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();
    await render(
      <ConfirmDialog visible title="Let this goal go?" body="Kept in history." confirmLabel="Let go" onConfirm={onConfirm} onCancel={onCancel} />,
    );
    await fireEvent.press(screen.getByLabelText('Let go'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    await fireEvent.press(screen.getAllByLabelText('Cancel').at(-1)!);
    expect(onCancel).toHaveBeenCalled();
  });
});

describe('Button', () => {
  it('does not fire while loading or disabled', async () => {
    const onPress = jest.fn();
    const { rerender } = await render(<Button label="Save" onPress={onPress} loading />);
    await fireEvent.press(screen.getByLabelText('Save'));
    await rerender(<Button label="Save" onPress={onPress} disabled />);
    await fireEvent.press(screen.getByLabelText('Save'));
    expect(onPress).not.toHaveBeenCalled();
  });
});
