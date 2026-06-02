import React from 'react';
import { Joyride, STATUS, ACTIONS, type Step, type CallBackProps } from 'react-joyride';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';

interface OnboardingTourProps {
  run: boolean;
  onFinish: () => void;
}

const OnboardingTour: React.FC<OnboardingTourProps> = ({ run, onFinish }) => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const direction = i18n.dir();

  const steps: Step[] = [
    {
      target: '#tour-sidebar',
      title: t('tour.sidebar_title'),
      content: t('tour.sidebar_content'),
      placement: 'right',
      disableBeacon: true,
    },
    {
      target: '#tour-search',
      title: t('tour.search_title'),
      content: t('tour.search_content'),
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: '#tour-view-toggler',
      title: t('tour.view_toggler_title'),
      content: t('tour.view_toggler_content'),
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: '#tour-graph-canvas',
      title: t('tour.graph_canvas_title'),
      content: t('tour.graph_canvas_content'),
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '#tour-graph-controls',
      title: t('tour.graph_controls_title'),
      content: t('tour.graph_controls_content'),
      placement: 'top',
      disableBeacon: true,
    },
    {
      target: '#tour-detail-panel',
      title: t('tour.detail_panel_title'),
      content: t('tour.detail_panel_content'),
      placement: 'left',
      disableBeacon: true,
    },
  ];

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, action } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status) || action === ACTIONS.CLOSE) {
      onFinish();
    }
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showProgress
      showSkipButton
      scrollToFirstStep
      callback={handleJoyrideCallback}
      disableOverlayClose
      locale={{
        back: t('tour.back'),
        close: t('tour.last'),
        last: t('tour.last'),
        next: t('tour.next'),
        skip: t('tour.skip'),
      }}
      styles={{
        // @ts-expect-error - options exists in Joyride styles
        options: {
          zIndex: 10000,
          primaryColor: theme.palette.primary.main,
          backgroundColor: theme.palette.background.paper,
          textColor: theme.palette.text.primary,
          arrowColor: theme.palette.background.paper,
        },
        tooltipContainer: {
          textAlign: direction === 'rtl' ? 'right' : 'left',
          direction: direction,
        },
      }}
    />
  );
};

export default OnboardingTour;
