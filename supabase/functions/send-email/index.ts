/**
 * Supabase Edge Function: Send Email
 * 
 * This function handles email sending on the server side to avoid CORS issues.
 * It receives email data from the frontend and sends emails via MailerSend.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  type: 'welcome' | 'group_invite' | 'member_added' | 'settle_up' | 'new_expense';
  data: any;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { type, data }: EmailRequest = await req.json()
    
    // Validate MailerSend configuration
    const mailersendApiKey = Deno.env.get('MAILERSEND_API_KEY')
    const fromEmail = Deno.env.get('MAILERSEND_FROM_EMAIL')
    
    if (!mailersendApiKey || !fromEmail) {
      return new Response(
        JSON.stringify({ error: 'MailerSend not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    let emailPayload: any = {}

    // Build email payload based on type
    switch (type) {
      case 'welcome':
        emailPayload = {
          from: { email: fromEmail, name: 'Kharch Baant' },
          to: [{ email: data.userEmail, name: data.userName }],
          subject: 'Welcome to Kharch Baant! 🎉',
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
                .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🎉 Welcome to Kharch Baant!</h1>
                </div>
                <div class="content">
                  <p>Hi ${data.userName},</p>
                  <p>Thanks for joining Kharch Baant! We're excited to help you track and split expenses with your friends and family.</p>
                  
                  <h3>What you can do:</h3>
                  <ul>
                    <li>✅ Create groups for trips, flat sharing, or any shared expenses</li>
                    <li>💰 Track expenses with smart split modes (equal, unequal, percentage, shares)</li>
                    <li>📊 See real-time balances and who owes what</li>
                    <li>🎫 Invite members via WhatsApp, SMS, or shareable links</li>
                    <li>🤖 Get AI-powered expense category suggestions</li>
                  </ul>

                  <a href="${data.appUrl || 'https://kharchbaant.com'}" class="button">Start Tracking Expenses</a>

                  <p>If you have any questions, feel free to reach out to us anytime.</p>
                  <p>Happy expense tracking! 🚀</p>
                </div>
                <div class="footer">
                  <p>Kharch Baant - Split expenses, not friendships</p>
                </div>
              </div>
            </body>
            </html>
          `,
          text: `
            Welcome to Kharch Baant, ${data.userName}!

            Thanks for joining! We're excited to help you track and split expenses.

            What you can do:
            - Create groups for trips, flat sharing, or any shared expenses
            - Track expenses with smart split modes
            - See real-time balances
            - Invite members easily
            - Get AI-powered suggestions

            Start now: ${data.appUrl || 'https://kharchbaant.com'}

            Kharch Baant - Split expenses, not friendships
          `
        }
        break

      case 'group_invite':
        emailPayload = {
          from: { email: fromEmail, name: 'Kharch Baant' },
          to: [{ email: data.inviteeEmail }],
          subject: `${data.inviterName} invited you to join "${data.groupName}" on Kharch Baant`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                .invite-box { background: white; border: 2px solid #10b981; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
                .button { display: inline-block; padding: 12px 30px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
                .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🎉 You're Invited!</h1>
                </div>
                <div class="content">
                  <p><strong>${data.inviterName}</strong> has invited you to join their expense group on Kharch Baant.</p>
                  
                  <div class="invite-box">
                    <h2>"${data.groupName}"</h2>
                    <p>Start tracking and splitting expenses together!</p>
                  </div>

                  <a href="${data.inviteUrl}" class="button">Join Group Now</a>

                  <p><strong>What happens next?</strong></p>
                  <ul>
                    <li>Click the button above to accept the invite</li>
                    <li>Sign in or create a free account (takes 30 seconds)</li>
                    <li>You'll be automatically added to the group</li>
                    <li>Start tracking expenses together!</li>
                  </ul>

                  <p style="color: #666; font-size: 14px;">⏰ This invite expires in ${data.expiresInDays} days</p>
                </div>
                <div class="footer">
                  <p>Kharch Baant - Split expenses, not friendships</p>
                  <p style="font-size: 12px; color: #999;">If you didn't expect this invitation, you can safely ignore this email.</p>
                </div>
              </div>
            </body>
            </html>
          `,
          text: `
            You're invited to join "${data.groupName}" on Kharch Baant!

            ${data.inviterName} wants you to join their expense group.

            Click here to join: ${data.inviteUrl}

            This invite expires in ${data.expiresInDays} days.

            Kharch Baant - Split expenses, not friendships
          `
        }
        break

      default:
        return new Response(
          JSON.stringify({ error: 'Unsupported email type' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
    }

    // Send email via MailerSend API
    const response = await fetch('https://api.mailersend.com/v1/email', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mailersendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('MailerSend API error:', errorText)
      return new Response(
        JSON.stringify({ error: 'Failed to send email', details: errorText }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const result = await response.json()
    console.log('Email sent successfully:', result)

    return new Response(
      JSON.stringify({ success: true, messageId: result.id }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Email function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
