import React from 'react';
import { useTranslation } from 'react-i18next';
import { useRTL } from '../../hooks/useRTL';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Divider,
} from '@mui/material';

const Settings = () => {
  const { t } = useTranslation();
  const { isRTL } = useRTL();

  return (
    <Box sx={{ p: 3 }}>
      <Typography 
        variant="h4" 
        gutterBottom
        sx={{ textAlign: isRTL ? 'right' : 'left' }}
      >
        {t('settings.title')}
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader 
              title={t('settings.general')} 
              sx={{ textAlign: isRTL ? 'right' : 'left' }}
            />
            <Divider />
            <CardContent>
              {/* General settings content will go here */}
              <Typography 
                color="textSecondary"
                sx={{ textAlign: isRTL ? 'right' : 'left' }}
              >
                {t('settings.comingSoon')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader 
              title={t('settings.notifications')} 
              sx={{ textAlign: isRTL ? 'right' : 'left' }}
            />
            <Divider />
            <CardContent>
              {/* Notification settings content will go here */}
              <Typography 
                color="textSecondary"
                sx={{ textAlign: isRTL ? 'right' : 'left' }}
              >
                {t('settings.comingSoon')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader 
              title={t('settings.appearance')} 
              sx={{ textAlign: isRTL ? 'right' : 'left' }}
            />
            <Divider />
            <CardContent>
              {/* Appearance settings content will go here */}
              <Typography 
                color="textSecondary"
                sx={{ textAlign: isRTL ? 'right' : 'left' }}
              >
                {t('settings.comingSoon')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader 
              title={t('settings.security')} 
              sx={{ textAlign: isRTL ? 'right' : 'left' }}
            />
            <Divider />
            <CardContent>
              {/* Security settings content will go here */}
              <Typography 
                color="textSecondary"
                sx={{ textAlign: isRTL ? 'right' : 'left' }}
              >
                {t('settings.comingSoon')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Settings; 