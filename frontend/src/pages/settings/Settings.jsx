import React from 'react';
import { useTranslation } from 'react-i18next';
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

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {t('settings.title')}
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title={t('settings.general')} />
            <Divider />
            <CardContent>
              {/* General settings content will go here */}
              <Typography color="textSecondary">
                {t('settings.comingSoon')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title={t('settings.notifications')} />
            <Divider />
            <CardContent>
              {/* Notification settings content will go here */}
              <Typography color="textSecondary">
                {t('settings.comingSoon')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title={t('settings.appearance')} />
            <Divider />
            <CardContent>
              {/* Appearance settings content will go here */}
              <Typography color="textSecondary">
                {t('settings.comingSoon')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title={t('settings.security')} />
            <Divider />
            <CardContent>
              {/* Security settings content will go here */}
              <Typography color="textSecondary">
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