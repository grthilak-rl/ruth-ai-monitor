const Docker = require('dockerode');

class DockerService {
  constructor() {
    this.docker = new Docker({ socketPath: '/var/run/docker.sock' });

    // Model container mapping
    this.modelContainers = {
      'fall-detection': 'ruth-model-fall-detection',
      'work-at-height': 'ruth-model-work-at-height'
    };
  }

  /**
   * Start a model container
   * @param {string} modelId - Model identifier (e.g., 'fall-detection')
   * @returns {Promise<Object>} Container info
   */
  async startModelContainer(modelId) {
    try {
      const containerName = this.modelContainers[modelId];

      if (!containerName) {
        throw new Error(`Unknown model ID: ${modelId}`);
      }

      console.log(`Starting container: ${containerName}`);

      // Get container by name
      const container = this.docker.getContainer(containerName);

      // Check if container exists
      try {
        const containerInfo = await container.inspect();

        // If container is already running, return success
        if (containerInfo.State.Running) {
          console.log(`Container ${containerName} is already running`);
          return {
            success: true,
            message: 'Container already running',
            container: containerName,
            status: 'running'
          };
        }

        // Start the stopped container
        await container.start();
        console.log(`Started container: ${containerName}`);

        return {
          success: true,
          message: 'Container started successfully',
          container: containerName,
          status: 'started'
        };

      } catch (inspectError) {
        // Container doesn't exist, need to create it using docker-compose
        console.log(`Container ${containerName} doesn't exist. Use docker-compose to create it.`);
        throw new Error(`Container ${containerName} not found. Please create it first using docker-compose.`);
      }

    } catch (error) {
      console.error(`Failed to start model container ${modelId}:`, error.message);
      throw error;
    }
  }

  /**
   * Stop a model container
   * @param {string} modelId - Model identifier (e.g., 'fall-detection')
   * @returns {Promise<Object>} Container info
   */
  async stopModelContainer(modelId) {
    try {
      const containerName = this.modelContainers[modelId];

      if (!containerName) {
        throw new Error(`Unknown model ID: ${modelId}`);
      }

      console.log(`Stopping container: ${containerName}`);

      const container = this.docker.getContainer(containerName);

      // Check if container exists and is running
      try {
        const containerInfo = await container.inspect();

        if (!containerInfo.State.Running) {
          console.log(`Container ${containerName} is not running`);
          return {
            success: true,
            message: 'Container already stopped',
            container: containerName,
            status: 'stopped'
          };
        }

        // Stop the container
        await container.stop({ t: 10 }); // 10 second timeout
        console.log(`Stopped container: ${containerName}`);

        return {
          success: true,
          message: 'Container stopped successfully',
          container: containerName,
          status: 'stopped'
        };

      } catch (inspectError) {
        console.log(`Container ${containerName} doesn't exist`);
        return {
          success: true,
          message: 'Container does not exist',
          container: containerName,
          status: 'not_found'
        };
      }

    } catch (error) {
      console.error(`Failed to stop model container ${modelId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get status of a model container
   * @param {string} modelId - Model identifier
   * @returns {Promise<Object>} Container status
   */
  async getModelContainerStatus(modelId) {
    try {
      const containerName = this.modelContainers[modelId];

      if (!containerName) {
        throw new Error(`Unknown model ID: ${modelId}`);
      }

      const container = this.docker.getContainer(containerName);

      try {
        const containerInfo = await container.inspect();

        return {
          exists: true,
          running: containerInfo.State.Running,
          status: containerInfo.State.Status,
          health: containerInfo.State.Health?.Status || 'none',
          startedAt: containerInfo.State.StartedAt,
          container: containerName
        };

      } catch (inspectError) {
        return {
          exists: false,
          running: false,
          status: 'not_found',
          container: containerName
        };
      }

    } catch (error) {
      console.error(`Failed to get model container status ${modelId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get status of all model containers
   * @returns {Promise<Object>} All container statuses
   */
  async getAllModelContainerStatuses() {
    const statuses = {};

    for (const modelId of Object.keys(this.modelContainers)) {
      try {
        statuses[modelId] = await this.getModelContainerStatus(modelId);
      } catch (error) {
        statuses[modelId] = {
          exists: false,
          running: false,
          error: error.message
        };
      }
    }

    return statuses;
  }
}

module.exports = new DockerService();
