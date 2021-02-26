const { App } = require('@slack/bolt')
const Client = require("@replit/database")
const database = new Client()

const app = new App({
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    token: process.env.SLACK_BOT_TOKEN,
})

async function main () {
    await app.start(process.env.PORT || 3000)
    
    //Slash command to list all projects
    app.command('/projects', async ({ command, ack, say }) => {
        await ack()
        // Gets current projects or sets currentProjects to an empty array if there is nothing
        let currentProjects = JSON.parse(await database.get("projects")) || [] 

        let response = ""
        // Loops through current projects and formats them into a bulleted list
        currentProjects.forEach((project, index) => {
          if(index % 2 == 1){
            response += `\n:purple_heart: ${project["project"]}`
          }
          else {
            response += `\n:black_heart: ${project["project"]}`
          }
        })

        if (response) {
            await say({
              blocks: [
              {
                "type": "section",
                "text": {
                  "type": "mrkdwn",
                  "text": ":purple_heart: *Project List* :purple_heart:"
                }
              },
              {
                "type": "divider"
              },
              {
                "type": "section",
                "text": {
                  "type": "mrkdwn",
                  "text": `This list has been created by members of this Slack. Each project should take roughly around 1 hour to complete.`
                }
              },
              {
                "type": "section",
                "text": {
                  "type": "mrkdwn",
                  "text": response
                }
              }
            ]
          })
        } else {
            await say(`Your project list is currently empty!`)
        }   
      })

    //Slash command to remove project
    //Only available for admins
    app.command('/removeproject', async ({ command, ack, say }) => {
        await ack()
        let currentProjects= JSON.parse(await database.get("projects")) || []  
        let result = []
        let adminBol = false
        let userList = await client.users.list()
        userList.members.forEach((user) => {
          if(user.id == command.user_id && user.is_admin){
            adminBol = true
          }
        })
        if(adminBol){
          currentProjects.forEach((item) => {
          if(item["project"].toLowerCase() != command.text.toLowerCase()) { result.push(item) }
          })
          await database.set("projects", JSON.stringify(result))
          await say(`Removed *${command.text}* from your project list`) 
        }
        else {
          await say(`Ask an admin to do this.`)
        }       
      })

      //Slash command to add project
      app.command('/addproject', async ({ command, ack, say }) => {
        await ack()
        let currentProjects = JSON.parse(await database.get("projects")) || [] 

        // Checks if the project has already been added
        let dup = false
        currentProjects.forEach((item) => {
          if(command.text.toLowerCase().indexOf(item["project"].toLowerCase()) != -1){
            dup = true
          }
        })

        // If the project has not been added already, pushes new project to the list of projects
        if(!dup) { 
          currentProjects.push({
            "project": command.text,
            "user": command.user_id
          }) 
          await database.set("projects", JSON.stringify(currentProjects)) // Set the array in the database

          await say({
            blocks: [
              {
                "type": "section",
                "text": {
                  "type": "mrkdwn",
                  "text": "*Thank you for your project submission!* :memo:"
                }
              },
              {
                "type": "divider"
              },
              {
                "type": "section",
                "text": {
                  "type": "mrkdwn",
                  "text": `Thank you, <@${command.user_id}>! I've added *${command.text}* to our list of projects.`
                }
              }
            ]
          })
        }
        else {
          await say("This project has already been added.")
        }
    })

    //Slash command to clear entire project list
    //Admins only
    app.command('/clearprojects', async ({ command, ack, say, client }) => {
      await ack()

      //Checks if user is an admin
      let adminBol = false
      let userList = await client.users.list()
      userList.members.forEach((user) => {
        if(user.id == command.user_id && user.is_admin){
          adminBol = true
        }
      })

      //Only deletes if user is an admin
      if(adminBol){
        await database.delete("projects")
        await say(`Cleared our project list.`)  
      }
      else {
        await say(`Ask an admin to do this.`)
      }       
    })

    //Slash command to get list of user's completed projects
    app.command('/completed', async ({ command, ack, say }) => {
      await ack()
      let currentProgress = JSON.parse(await database.get(command.user_id)) || [] 

      // Nicely format the array 
      let response = ""
      currentProgress.forEach((project, index) => {
        if(index % 2 == 1){
          response += `\n:purple_heart: Completed ${project["project"]} on ${project["date"]}`
        }
        else {
          response += `\n:black_heart: Completed *${project["project"]}* on *${project["date"]}*`
        }
      })
    
      if (response) {
          await say({
            blocks: [
            {
              "type": "section",
              "text": {
                "type": "mrkdwn",
                "text": "Your Completed Project List"
              }
            },
            {
              "type": "divider"
            },
            {
              "type": "section",
              "text": {
                "type": "mrkdwn",
                "text": `This is a list of the projects you've completed.`
              }
            },
            {
              "type": "section",
              "text": {
                "type": "mrkdwn",
                "text": response
              }
            }
          ]
        })
      } 
      else {
        await say(`Your completed project list is currently empty!`)
      }   
    })

    //Slash command to add completed project to user's list
    app.command('/addcompleted', async ({ command, ack, say }) => {
      await ack()
      let currentProgress = JSON.parse(await database.get(command.user_id)) || [] 
      
      // Gets today's date and formats it
      let today = new Date();
      let dd = String(today.getDate()).padStart(2, '0');
      let mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
      let yyyy = today.getFullYear();
      today = mm + '/' + dd + '/' + yyyy;

      //Pushes project and date to user's list
      currentProgress.push({
        "project": command.text,
        "date": today
      }) 
      await database.set(command.user_id, JSON.stringify(currentProgress)) // Set the array in the database
     
      await say({
        blocks: [
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": "*Nice job!* :facepunch:"
            }
          },
          {
            "type": "divider"
          },
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": `Great work, <@${command.user_id}>! I've added *${command.text}* to your list of completed projects.`
            }
          }
        ]
      })
    })

    //Slash command to clear entire user's completed project list
    app.command('/clearcompleted', async ({ ack, body, client }) => {
      await ack()
      try {
      const result = await client.views.open({

        // Pass a valid trigger_id within 3 seconds of receiving it
        trigger_id: body.trigger_id,
        // View payload
        view: {
          type: 'modal',
          "callback_id": "clear-conf",
          title: {
            type: 'plain_text',
            text: 'Confirmation'
          },
          submit: {
            "type": "plain_text",
            "text": "Submit"
          },
          blocks: [
            {
              "type": "input",
              "block_id":"block_1",
              "element": {
                "type": "static_select",
                "action_id": "static_select-action",
                "placeholder": {
                  "type": "plain_text",
                  "text": "Select an item",
                  "emoji": true
                },
                "options": [
                  {
                    "text": {
                      "type": "plain_text",
                      "text": "Yes",
                      "emoji": true
                    },
                    "value": "value-0"
                  },
                  {
                    "text": {
                      "type": "plain_text",
                      "text": "No",
                      "emoji": true
                    },
                    "value": "value-1"
                  }
                ],
              },
              "label": {
                "type": "plain_text",
                "text": "Are you sure you want to delete your completed list?",
                "emoji": true
              }
            }
          ]
        }
        })
      }
      catch (error) {
        console.error(error);
      }
    })
    
    //Runs when user interacts with modal above
    app.view("clear-conf", async ({ body, view, ack, client, payload }) => {

      // Acknowledge the action
      await ack()
      // Receives the user's decision
      const val = view['state']['values']['block_1']['static_select-action']['selected_option']['text']['text']

      if(val == 'Yes') {
        await client.views.open({
            trigger_id: body.trigger_id,
            "response_action": "push",
            "view": {
              "type": "modal",
              "title": {
                "type": "plain_text",
                "text": "Confirmed"
              },
              "blocks": [
                {
                  "type": "image",
                  "image_url": "https://media.tenor.com/images/ad7f5a2f78bde0c98fc3ec66e678ad33/tenor.gif",
                  "alt_text": "Cool cat in sunglasses."
                },
                {
                  "type": "context",
                  "elements": [
                    {
                      "type": "mrkdwn",
                      "text": "I cleared your completed projects list."
                    }
                  ]
                }
              ]
            }
        })
        await database.delete(body['user']['id'])
      }
      else {
        await client.views.open({
            trigger_id: body.trigger_id,
            "response_action": "push",
            "view": {
              "type": "modal",
              "title": {
                "type": "plain_text",
                "text": "Confirmed"
              },
              "blocks": [
                {
                  "type": "image",
                  "image_url": "https://media.tenor.com/images/22950d8b41732282904e13838f3c252c/tenor.gif",
                  "alt_text": "Elephant in sneakers"
                },
                {
                  "type": "context",
                  "elements": [
                    {
                      "type": "mrkdwn",
                      "text": "I didn't clear your completed projects list."
                    }
                  ]
                }
              ]
            }
        })
      }
    })

    //Slash command to delete a completed project
    app.command('/removecompleted', async ({ command, ack, say, client, body }) => {
      await ack()
      try {
        const result = await client.views.open({
          // Pass a valid trigger_id within 3 seconds of receiving it
          trigger_id: body.trigger_id,
          // View payload
          view: {
            type: 'modal',
            "callback_id": "delete-conf",
            title: {
              type: 'plain_text',
              text: 'Confirmation'
            },
            submit: {
              "type": "plain_text",
              "text": "Submit"
            },
            blocks: [
              {
                "type": "input",
                "block_id":"block_1",
                "element": {
                  "type": "static_select",
                  "action_id": "static_select-action",
                  "placeholder": {
                    "type": "plain_text",
                    "text": "Select an item",
                    "emoji": true
                  },
                  "options": [
                    {
                      "text": {
                        "type": "plain_text",
                        "text": "Yes",
                        "emoji": true
                      },
                      "value": `${command.text}`
                    },
                    {
                      "text": {
                        "type": "plain_text",
                        "text": "No",
                        "emoji": true
                      },
                      "value": "value-1"
                    }
                  ],
                },
                "label": {
                  "type": "plain_text",
                  "text": `Are you sure you want to delete ${command.text} from your completed list?`,
                  "emoji": true
                }
              }
            ]
          }
        })
      }
      catch (error) {
        console.error(error);
      }    
    })
    
    //Runs when user interacts with modal above
    app.view("delete-conf", async ({ body, view, ack, client, payload }) => {
      // Acknowledge the action
      await ack()
      const val = view['state']['values']['block_1']['static_select-action']['selected_option']['text']['text']
      if(val == 'Yes') {
        await client.views.open({
            trigger_id: body.trigger_id,
            "response_action": "push",
            "view": {
              "type": "modal",
              "title": {
                "type": "plain_text",
                "text": "Confirmed"
              },
              "blocks": [
                {
                  "type": "image",
                  "image_url": "https://media.tenor.com/images/7eab24e729e5500886d26a3b69f88d08/tenor.gif",
                  "alt_text": "Donkey in hammock."
                },
                {
                  "type": "context",
                  "elements": [
                    {
                      "type": "mrkdwn",
                      "text": `I deleted ${view['state']['values']['block_1']['static_select-action']['selected_option']['value']} from your completed projects list.`
                    }
                  ]
                }
              ]
            }
        })

        //Removes project from list
        let currentProjects= JSON.parse(await database.get(body['user']['id'])) || []  
        let result = []
        currentProjects.forEach((item) => {
          if(item['project'].toLowerCase() != view['state']['values']['block_1']['static_select-action']['selected_option']['value'].toLowerCase()) {
            result.push(item) 
          }
        })
        await database.set(body['user']['id'], JSON.stringify(result))
      }
      else {
        await client.views.open({
            trigger_id: body.trigger_id,
            "response_action": "push",
            "view": {
              "type": "modal",
              "title": {
                "type": "plain_text",
                "text": "Confirmed"
              },
              "blocks": [
                {
                  "type": "image",
                  "image_url": "https://media.tenor.com/images/44b643552319f6f021bb1924496a5aa2/tenor.gif",
                  "alt_text": "Dog dancing in time warp."
                },
                {
                  "type": "context",
                  "elements": [
                    {
                      "type": "mrkdwn",
                      "text": `I didn't delete ${view['state']['values']['block_1']['static_select-action']['selected_option']['value']} from your completed projects list.`
                    }
                  ]
                }
              ]
            }
        })
      }
    })

    //Slash command to choose a random project from the list
    app.command('/projectroulette', async ({ command, ack, say }) => {
      await ack()
      let currentProjects = JSON.parse(await database.get("projects")) || []
      let roulette = Math.floor((Math.random() * currentProjects.length))
      await say(`Rolling...`)
      await sleep(2000)
      await say(`Rolling...`)
      await sleep(2000);
      await say(`Rolling...`)
      await sleep(2000);
      await say(`You rolled *${currentProjects[roulette]["project"]}*. Now go do it!`)

    })

    console.log('⚡️ Server ready')
}

//Function that delays the message time
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

main()