import React from 'react';
import { Joyride, STATUS, ACTIONS, type Step, type EventData } from 'react-joyride';
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
      placement: 'right-start',
      skipBeacon: true,
    },
    {
      target: '#tour-search',
      title: t('tour.search_title'),
      content: t('tour.search_content'),
      placement: 'bottom',
      skipBeacon: true,
    },
    {
      target: '#tour-view-toggler',
      title: t('tour.view_toggler_title'),
      content: t('tour.view_toggler_content'),
      placement: 'bottom',
      skipBeacon: true,
    },
    {
      target: '#tour-graph-canvas',
      title: t('tour.graph_canvas_title'),
      content: t('tour.graph_canvas_content'),
      placement: 'center',
      skipBeacon: true,
    },
    {
      target: '#tour-graph-controls',
      title: t('tour.graph_controls_title'),
      content: t('tour.graph_controls_content'),
      placement: 'top',
      skipBeacon: true,
    },
    {
      target: '#tour-detail-panel',
      title: t('tour.detail_panel_title'),
      content: t('tour.detail_panel_content'),
      placement: 'left',
      skipBeacon: true,
    },
  ];

  const handleJoyrideEvent = (data: EventData) => {
    const { status, action } = data;

    // Handle tour completion
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED || action === ACTIONS.CLOSE) {
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
      onEvent={handleJoyrideEvent}
      overlayClickAction={false}
      spotlightClicks={false}
      hideCloseButton={false}
      disableScrolling={false}
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
          width: 320,
        },
        tooltipContainer: {
          textAlign: direction === 'rtl' ? 'right' : 'left',
          direction: direction,
        },
        tooltip: {
          maxWidth: 320,
        },
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        },
      }}
    />
  );
};

export default OnboardingTour;
