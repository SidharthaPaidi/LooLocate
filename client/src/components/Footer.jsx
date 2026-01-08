import React from 'react'
import { Card, CardContent, CardActions, Typography, IconButton } from '@mui/material';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import GitHubIcon from '@mui/icons-material/GitHub';
import EmailIcon from '@mui/icons-material/Email';

export default function Footer() {
    return (
        <>
            <Card
                sx={{
                    mt: 5,
                    py: 3,
                    borderRadius: 3,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 1.5,
                    boxShadow: 1,
                }}
            >
                <CardContent sx={{ textAlign: 'center', pb: 1 }}>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        Built with ❤️ by <strong>Saisidhartha Paidi</strong>
                    </Typography>

                    <Typography variant="caption" color="text.secondary">
                        Helping people find clean and accessible restrooms
                    </Typography>
                </CardContent>

                <CardActions sx={{ gap: 1 }}>
                    <IconButton
                        component="a"
                        href="https://www.linkedin.com/in/saisidharthapaidi/"
                        target="_blank"
                        aria-label="LinkedIn"
                    >
                        <LinkedInIcon />
                    </IconButton>

                    <IconButton
                        component="a"
                        href="https://github.com/SidharthaPaidi"
                        target="_blank"
                        aria-label="GitHub"
                    >
                        <GitHubIcon />
                    </IconButton>

                    <IconButton
                        component="a"
                        href="mailto:paidisaisidhartha9@gmail.com"
                        aria-label="Email"
                    >
                        <EmailIcon />
                    </IconButton>
                </CardActions>

                <Typography variant="caption" color="text.secondary">
                    © {new Date().getFullYear()} Loo Locater. All rights reserved.
                </Typography>
            </Card>
        </>
    )
}