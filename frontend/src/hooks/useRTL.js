import { useTranslation } from 'react-i18next';
import React from 'react';

export const useRTL = () => {
    const { i18n } = useTranslation();

    const isRTL = i18n.language === 'ar';

    // Apply global CSS for RTL/LTR text alignment
    React.useEffect(() => {
        // Set body direction
        document.body.dir = isRTL ? 'rtl' : 'ltr';

        const styleId = 'rtl-text-alignment';
        let styleElement = document.getElementById(styleId);

        if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.id = styleId;
            document.head.appendChild(styleElement);
        }

        const css = `
            /* Global text alignment based on body direction - but preserve center alignment */
            body[dir="rtl"] *:not([style*="text-align: center"]) {
                text-align: right !important;
            }
            
            body[dir="ltr"] *:not([style*="text-align: center"]) {
                text-align: left !important;
            }
            
            /* Override for all Material-UI Typography variants - but preserve center alignment */
            body[dir="rtl"] .MuiTypography-root:not([style*="text-align: center"]),
            body[dir="rtl"] .MuiTypography-body1:not([style*="text-align: center"]),
            body[dir="rtl"] .MuiTypography-body2:not([style*="text-align: center"]),
            body[dir="rtl"] .MuiTypography-h1:not([style*="text-align: center"]),
            body[dir="rtl"] .MuiTypography-h2:not([style*="text-align: center"]),
            body[dir="rtl"] .MuiTypography-h3:not([style*="text-align: center"]),
            body[dir="rtl"] .MuiTypography-h4:not([style*="text-align: center"]),
            body[dir="rtl"] .MuiTypography-h5:not([style*="text-align: center"]),
            body[dir="rtl"] .MuiTypography-h6:not([style*="text-align: center"]),
            body[dir="rtl"] .MuiTypography-subtitle1:not([style*="text-align: center"]),
            body[dir="rtl"] .MuiTypography-subtitle2:not([style*="text-align: center"]),
            body[dir="rtl"] .MuiTypography-caption:not([style*="text-align: center"]),
            body[dir="rtl"] .MuiTypography-overline:not([style*="text-align: center"]) {
                text-align: right !important;
            }
            
            body[dir="ltr"] .MuiTypography-root:not([style*="text-align: center"]),
            body[dir="ltr"] .MuiTypography-body1:not([style*="text-align: center"]),
            body[dir="ltr"] .MuiTypography-body2:not([style*="text-align: center"]),
            body[dir="ltr"] .MuiTypography-h1:not([style*="text-align: center"]),
            body[dir="ltr"] .MuiTypography-h2:not([style*="text-align: center"]),
            body[dir="ltr"] .MuiTypography-h3:not([style*="text-align: center"]),
            body[dir="ltr"] .MuiTypography-h4:not([style*="text-align: center"]),
            body[dir="ltr"] .MuiTypography-h5:not([style*="text-align: center"]),
            body[dir="ltr"] .MuiTypography-h6:not([style*="text-align: center"]),
            body[dir="ltr"] .MuiTypography-subtitle1:not([style*="text-align: center"]),
            body[dir="ltr"] .MuiTypography-subtitle2:not([style*="text-align: center"]),
            body[dir="ltr"] .MuiTypography-caption:not([style*="text-align: center"]),
            body[dir="ltr"] .MuiTypography-overline:not([style*="text-align: center"]) {
                text-align: left !important;
            }
            
            /* Override for specific Material-UI generated classes - but preserve center alignment */
            body[dir="rtl"] [class*="MuiTypography-root"]:not([style*="text-align: center"]),
            body[dir="rtl"] [class*="MuiTypography-body"]:not([style*="text-align: center"]),
            body[dir="rtl"] [class*="MuiTypography-h"]:not([style*="text-align: center"]),
            body[dir="rtl"] [class*="MuiTypography-subtitle"]:not([style*="text-align: center"]),
            body[dir="rtl"] [class*="MuiTypography-caption"]:not([style*="text-align: center"]),
            body[dir="rtl"] [class*="MuiTypography-overline"]:not([style*="text-align: center"]),
            body[dir="rtl"] [class*="muirtl-"]:not([style*="text-align: center"]) {
                text-align: right !important;
            }
            
            body[dir="ltr"] [class*="MuiTypography-root"]:not([style*="text-align: center"]),
            body[dir="ltr"] [class*="MuiTypography-body"]:not([style*="text-align: center"]),
            body[dir="ltr"] [class*="MuiTypography-h"]:not([style*="text-align: center"]),
            body[dir="ltr"] [class*="MuiTypography-subtitle"]:not([style*="text-align: center"]),
            body[dir="ltr"] [class*="MuiTypography-caption"]:not([style*="text-align: center"]),
            body[dir="ltr"] [class*="MuiTypography-overline"]:not([style*="text-align: center"]),
            body[dir="ltr"] [class*="muirtl-"]:not([style*="text-align: center"]) {
                text-align: left !important;
            }
            
            /* Override for any element with text-align property - but preserve center alignment */
            body[dir="rtl"] *[style*="text-align: left"]:not([style*="text-align: center"]) {
                text-align: right !important;
            }
            
            body[dir="ltr"] *[style*="text-align: right"]:not([style*="text-align: center"]) {
                text-align: left !important;
            }
        `;

        styleElement.textContent = css;
    }, [isRTL]);

    const rtlProps = {
        textAlign: isRTL ? 'right' : 'left',
        direction: isRTL ? 'rtl' : 'ltr',
        flexDirection: isRTL ? 'row-reverse' : 'row',
        justifyContent: isRTL ? 'flex-start' : 'flex-end',
        marginLeft: isRTL ? 0 : undefined,
        marginRight: isRTL ? undefined : 0,
        paddingLeft: isRTL ? 0 : undefined,
        paddingRight: isRTL ? undefined : 0,
    };

    const inputProps = {
        '& .MuiInputBase-input': {
            textAlign: isRTL ? 'right' : 'left',
            direction: isRTL ? 'rtl' : 'ltr'
        },
        '& .MuiInputLabel-root': {
            textAlign: isRTL ? 'right' : 'left'
        }
    };

    const cardProps = {
        display: 'flex',
        alignItems: 'center',
        flexDirection: isRTL ? 'row-reverse' : 'row',
        textAlign: isRTL ? 'right' : 'left'
    };

    // New card layout with grid system for better icon positioning
    const cardGridProps = {
        display: 'grid',
        gridTemplateColumns: isRTL ? '9fr 3fr' : '9fr 3fr',
        alignItems: 'center',
        gap: 2,
        textAlign: isRTL ? 'right' : 'left'
    };

    // Icon container props
    const iconContainerProps = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 48,
        height: 48,
        borderRadius: 1,
        backgroundColor: 'action.hover',
        color: 'primary.main'
    };

    // Text container props
    const textContainerProps = {
        display: 'flex',
        flexDirection: 'column',
        textAlign: isRTL ? 'right' : 'left'
    };

    // High priority text alignment styles that override Material-UI defaults
    const textAlignProps = {
        '& .MuiTypography-root': {
            textAlign: isRTL ? 'right' : 'left !important'
        },
        '& .MuiTypography-body1': {
            textAlign: isRTL ? 'right' : 'left !important'
        },
        '& .MuiTypography-body2': {
            textAlign: isRTL ? 'right' : 'left !important'
        },
        '& .MuiTypography-h1': {
            textAlign: isRTL ? 'right' : 'left !important'
        },
        '& .MuiTypography-h2': {
            textAlign: isRTL ? 'right' : 'left !important'
        },
        '& .MuiTypography-h3': {
            textAlign: isRTL ? 'right' : 'left !important'
        },
        '& .MuiTypography-h4': {
            textAlign: isRTL ? 'right' : 'left !important'
        },
        '& .MuiTypography-h5': {
            textAlign: isRTL ? 'right' : 'left !important'
        },
        '& .MuiTypography-h6': {
            textAlign: isRTL ? 'right' : 'left !important'
        },
        '& .MuiTypography-subtitle1': {
            textAlign: isRTL ? 'right' : 'left !important'
        },
        '& .MuiTypography-subtitle2': {
            textAlign: isRTL ? 'right' : 'left !important'
        },
        '& .MuiTypography-caption': {
            textAlign: isRTL ? 'right' : 'left !important'
        },
        '& .MuiTypography-overline': {
            textAlign: isRTL ? 'right' : 'left !important'
        }
    };

    // Container props that apply high priority text alignment
    const containerProps = {
        ...textAlignProps,
        direction: isRTL ? 'rtl' : 'ltr',
        textAlign: isRTL ? 'right' : 'left'
    };

    return {
        isRTL,
        rtlProps,
        inputProps,
        cardProps,
        cardGridProps,
        iconContainerProps,
        textContainerProps,
        textAlignProps,
        containerProps
    };
}; 