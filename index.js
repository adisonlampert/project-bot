const { App } = require('@slack/bolt')
const Client = require("@replit/database")
const database = new Client()

const app = new App({
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    token: process.env.SLACK_BOT_TOKEN,
})

async function main () {
    await app.start(process.env.PORT || 3000)

    app.command('/removeproject', async ({ command, ack, say }) => {
        await ack()
        let currentProjects= JSON.parse(await database.get("projects")) || []  
        let result = []
        currentProjects.forEach((item) => {
          if(item["project"].toLowerCase() != command.text.toLowerCase()) { result.push(item) }
        })
        await database.set("projects", JSON.stringify(result)) 
        await say(`Removed *${command.text}* from your project list`)
      })

      app.command('/projects', async ({ command, ack, say }) => {
        await ack()

        let currentProjects = JSON.parse(await database.get("projects")) || [] // Get the user's array, and if the user has never used this todo list before, use an empty array

        // Nicely format the array as a list with numbers
        let response = ""
        currentProjects.forEach((project, index) => {
          if(index % 2 == 1){
            response += `\n:purple_heart: ${project["project"]}`
          }
          else {
            response += `\n:black_heart: ${project["project"]}`
          }
        })

          // If the user has items in the todo list, respond with it. Otherwise, send a message stating the list is empty
          if (response) {
              await say({
                blocks: [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": ":purple_heart: *WiCS Project List* :purple_heart:"
                  }
                },
                {
                  "type": "divider"
                },
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": `This list has been created by members of WiCS. Each project should take roughly around 1 hour to complete.`
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

      app.command('/addproject', async ({ command, ack, say }) => {
        await ack()
        let currentProgress = JSON.parse(await database.get("projects")) || [] // Same as previous command, get the array, if it doesn't exist, use an empty one
        currentProjects.push({
          "project": command.text,
          "date": command.user_id
        }) // Add the new item to the array
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
    })

    //Slash command to clear entire project list
    app.command('/clearprojects', async ({ command, ack, say }) => {
        await ack()
        await database.empty("projects")
        // Set the array in the database
        await say(`Cleared our project list.`)
      })
    
    //Slash command to delete duplicate entries
    app.command('/cleanprojects', async ({ command, ack, say }) => {
      await ack()
      let currentProjects = JSON.parse(await database.get("projects")) || []
      let result = []
      currentProjects.forEach((item) => {
        let dup = false
        result.forEach((item2, index) => {
          if(item2["project"].indexOf(item["project"]) != -1){
            dup = true
          }
        })
        if(!dup) { result.push(item) }
      })
      await database.set("projects", JSON.stringify(result)) 
      await say(`Cleaned project list.`)
    })

    app.command('/completed', async ({ command, ack, say }) => {
        await ack()

        let currentProgress = JSON.parse(await database.get(command.user_id)) || [] // Get the user's array, and if the user has never used this todo list before, use an empty array

        // Nicely format the array as a list with numbers
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
          } else {
              await say(`Your completed project list is currently empty!`)
          }
            
        })

        app.command('/addcompleted', async ({ command, ack, say }) => {
        await ack()
        let currentProgress = JSON.parse(await database.get(command.user_id)) || [] 

        let today = new Date();
        let dd = String(today.getDate()).padStart(2, '0');
        let mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
        let yyyy = today.getFullYear();
        today = mm + '/' + dd + '/' + yyyy;

        currentProgress.push({
          "project": command.text,
          "date": today
        }) // Add the new item to the array
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

    console.log('⚡️ Server ready')
}

main()