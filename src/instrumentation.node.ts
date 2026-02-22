import { NodeSDK } from '@opentelemetry/sdk-node';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

const sdk = new NodeSDK({
    resource: resourceFromAttributes({
        [ATTR_SERVICE_NAME]: 'nextjs-frontend',
    }),
    spanProcessor: new SimpleSpanProcessor(new OTLPTraceExporter({
        url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?
            `${process.env.OTEL_EXPORTER_OTLP_ENDPOINT}/v1/traces` :
            'http://localhost:4318/v1/traces',
    })),
});

sdk.start();
